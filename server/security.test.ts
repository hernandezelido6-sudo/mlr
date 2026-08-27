import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { consumeRateLimit, decryptSensitiveText, encryptSensitiveText, quoteRequestInputSchema } from "./security";
import type { TrpcContext } from "./_core/context";

const validQuote = { name: "  Ana <b>Ruta</b>  ", phone: "+1 (555) 123-4567", email: "ANA@EXAMPLE.COM", cargo: "Remolque de viaje", origin: "Austin", destination: "Denver", details: "Unidad de 30 pies", website: "" };
const adminContext = {
  user: { id: 1, openId: "security-admin", name: "Admin", email: "admin@example.com", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {}, get: () => undefined } as TrpcContext["req"],
  res: { clearCookie: () => undefined } as TrpcContext["res"],
} as TrpcContext;
const userContext = { ...adminContext, user: { ...adminContext.user!, id: 2, role: "user" as const } } as TrpcContext;
const anonymousContext = { ...adminContext, user: null } as TrpcContext;
describe("quote request security", () => {
  it("normalizes plain text and rejects field manipulation or honeypot values", () => { const parsed = quoteRequestInputSchema.parse(validQuote); expect(parsed.name).toBe("Ana Ruta"); expect(parsed.email).toBe("ana@example.com"); expect(quoteRequestInputSchema.safeParse({ ...validQuote, status: "closed" }).success).toBe(false); expect(quoteRequestInputSchema.safeParse({ ...validQuote, website: "https://bot.invalid" }).success).toBe(false); });
  it("encrypts confidential request fields with authenticated encryption", () => { const sealed = encryptSensitiveText("Información confidencial de transporte"); expect(sealed).not.toContain("Información confidencial"); expect(decryptSensitiveText(sealed)).toBe("Información confidencial de transporte"); });
  it("reports encryption readiness only through an administrative API procedure", async () => { const caller = appRouter.createCaller(adminContext); await expect(caller.security.encryptionStatus()).resolves.toEqual({ encryptionReady: true }); });
  it("requires an authenticated owner and forbids non-admin access to the full request list", async () => {
    await expect(appRouter.createCaller(anonymousContext).quote.mine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(appRouter.createCaller(userContext).quote.all()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("enforces a bounded request quota", () => { const key = `test:${crypto.randomUUID()}`; expect(consumeRateLimit(key, 2, 60_000, 1_000)).toBe(true); expect(consumeRateLimit(key, 2, 60_000, 1_001)).toBe(true); expect(consumeRateLimit(key, 2, 60_000, 1_002)).toBe(false); });
});
