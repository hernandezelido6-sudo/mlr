import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { Express, Request, RequestHandler } from "express";
import { z } from "zod";
import { ENV } from "./_core/env";

const AAD = Buffer.from("ruta-norte:quote-request:v1", "utf8");
const MAX_BUCKETS = 10_000;
const rateBuckets = new Map<string, number[]>();

function normalizeText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(min: number, max: number) {
  return z.string().transform(normalizeText).pipe(z.string().min(min).max(max));
}

export const quoteRequestInputSchema = z
  .object({
    name: cleanText(2, 120),
    phone: cleanText(7, 32).refine(value => /^[0-9+().\-\s]+$/.test(value), "Invalid phone number"),
    email: z.string().trim().toLowerCase().max(320).email(),
    cargo: z.enum(["Remolque de viaje", "Fifth wheel / camper", "Carga especial", "Otro"]),
    origin: cleanText(2, 120),
    destination: cleanText(2, 120),
    details: cleanText(0, 1_500).optional().default(""),
    // Honeypot field. Human users never see it; a filled value is rejected.
    website: z.string().max(0).optional().default(""),
  })
  .strict();

export type QuoteRequestInput = z.infer<typeof quoteRequestInputSchema>;

function getEncryptionKey() {
  const secret = process.env.QUOTE_ENCRYPTION_KEY ?? "";
  if (secret.length < 32) throw new Error("Server encryption key is unavailable");
  return createHash("sha256").update(`${secret}:ruta-norte:quote-encryption`).digest();
}

export function isEncryptionConfigured() {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptSensitiveText(plainText: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  cipher.setAAD(AAD);
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSensitiveText(sealedValue: string) {
  const [version, ivValue, tagValue, ciphertextValue] = sealedValue.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !ciphertextValue) throw new Error("Encrypted value has an invalid format");
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAAD(AAD);
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString("utf8");
}

function getClientIdentity(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const address = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim() || req.ip || "unknown";
  const userAgent = req.get("user-agent") ?? "";
  // Store only a keyed digest, never a raw IP address or user agent.
  return createHash("sha256").update(`${ENV.cookieSecret}:${address}:${userAgent}`).digest("hex");
}

export function getRequestFingerprint(req: Request) {
  return getClientIdentity(req);
}

export function consumeRateLimit(key: string, maxRequests: number, windowMs: number, now = Date.now()) {
  const recent = (rateBuckets.get(key) ?? []).filter(timestamp => timestamp > now - windowMs);
  if (recent.length >= maxRequests) {
    rateBuckets.set(key, recent);
    return false;
  }
  recent.push(now);
  if (!rateBuckets.has(key) && rateBuckets.size >= MAX_BUCKETS) {
    const oldestKey = rateBuckets.keys().next().value;
    if (oldestKey) rateBuckets.delete(oldestKey);
  }
  rateBuckets.set(key, recent);
  return true;
}

export function rateLimitMiddleware(scope: string, maxRequests: number, windowMs: number): RequestHandler {
  return (req, res, next) => {
    const fingerprint = getRequestFingerprint(req);
    if (!consumeRateLimit(`${scope}:${fingerprint}`, maxRequests, windowMs)) {
      res.status(429).json({ error: "too many requests" });
      return;
    }
    next();
  };
}

function isForwardedHttps(req: Request) {
  const protocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  return req.protocol === "https" || protocol === "https";
}

export function installSecurityMiddleware(app: Express) {
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    if (ENV.isProduction && req.get("x-forwarded-proto") && !isForwardedHttps(req)) {
      const host = req.get("host");
      if (!host || !/^[a-z0-9.-]+(?::\d+)?$/i.test(host)) {
        res.status(400).json({ error: "invalid host" });
        return;
      }
      res.redirect(308, `https://${host}${req.originalUrl}`);
      return;
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=(), usb=()");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    res.setHeader("X-DNS-Prefetch-Control", "off");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Origin-Agent-Cluster", "?1");
    if (ENV.isProduction) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Content-Security-Policy", "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self'; connect-src 'self' https:; upgrade-insecure-requests");
    }
    next();
  });
}
