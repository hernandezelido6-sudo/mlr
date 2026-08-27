import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { randomUUID } from "crypto";
import { InsertUser, quoteRequests, users } from "../drizzle/schema";
import { decryptSensitiveText, encryptSensitiveText, type QuoteRequestInput } from "./security";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() { if (!_db && process.env.DATABASE_URL) { try { _db = drizzle(process.env.DATABASE_URL); } catch { console.warn("[Database] Connection is unavailable"); _db = null; } } return _db; }
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert"); const db = await getDb(); if (!db) throw new Error("Database is unavailable");
  const values: InsertUser = { openId: user.openId }; const updateSet: Record<string, unknown> = {}; const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => { if (user[field] !== undefined) { const value = user[field] ?? null; values[field] = value; updateSet[field] = value; } });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date(); if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date(); await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0]; }
export async function createQuoteRequest(ownerId: number, input: QuoteRequestInput, requestFingerprint: string) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable"); const id = randomUUID();
  await db.insert(quoteRequests).values({ id, ownerId, nameCiphertext: encryptSensitiveText(input.name), phoneCiphertext: encryptSensitiveText(input.phone), emailCiphertext: encryptSensitiveText(input.email), originCiphertext: encryptSensitiveText(input.origin), destinationCiphertext: encryptSensitiveText(input.destination), detailsCiphertext: encryptSensitiveText(input.details), cargo: input.cargo, requestFingerprint }); return { id };
}
export async function listQuoteRequestsForOwner(ownerId: number) { const db = await getDb(); if (!db) throw new Error("Database is unavailable"); return db.select({ id: quoteRequests.id, cargo: quoteRequests.cargo, status: quoteRequests.status, createdAt: quoteRequests.createdAt }).from(quoteRequests).where(eq(quoteRequests.ownerId, ownerId)).orderBy(desc(quoteRequests.createdAt)); }
export async function listQuoteRequestsForAdmin() { const db = await getDb(); if (!db) throw new Error("Database is unavailable"); return db.select({ id: quoteRequests.id, ownerId: quoteRequests.ownerId, cargo: quoteRequests.cargo, status: quoteRequests.status, createdAt: quoteRequests.createdAt }).from(quoteRequests).orderBy(desc(quoteRequests.createdAt)); }
export async function getQuoteRequestForActor(id: string, actor: { id: number; role: "user" | "admin" }) {
  const db = await getDb(); if (!db) throw new Error("Database is unavailable"); const accessFilter = actor.role === "admin" ? eq(quoteRequests.id, id) : and(eq(quoteRequests.id, id), eq(quoteRequests.ownerId, actor.id)); const record = (await db.select().from(quoteRequests).where(accessFilter).limit(1))[0]; if (!record) return null;
  return { id: record.id, cargo: record.cargo, status: record.status, createdAt: record.createdAt, contact: { name: decryptSensitiveText(record.nameCiphertext), phone: decryptSensitiveText(record.phoneCiphertext), email: decryptSensitiveText(record.emailCiphertext) }, route: { origin: decryptSensitiveText(record.originCiphertext), destination: decryptSensitiveText(record.destinationCiphertext), details: decryptSensitiveText(record.detailsCiphertext) } };
}
