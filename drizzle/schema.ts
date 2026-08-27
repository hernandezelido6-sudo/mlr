import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"), email: varchar("email", { length: 320 }), loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// Contact and route fields are encrypted before persistence. The server scopes all reads to the owner or a verified administrator.
export const quoteRequests = mysqlTable("quote_requests", {
  id: varchar("id", { length: 36 }).primaryKey(), ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  nameCiphertext: text("nameCiphertext").notNull(), phoneCiphertext: text("phoneCiphertext").notNull(), emailCiphertext: text("emailCiphertext").notNull(),
  originCiphertext: text("originCiphertext").notNull(), destinationCiphertext: text("destinationCiphertext").notNull(), detailsCiphertext: text("detailsCiphertext").notNull(),
  cargo: varchar("cargo", { length: 80 }).notNull(), status: mysqlEnum("status", ["new", "reviewing", "closed"]).default("new").notNull(), requestFingerprint: varchar("requestFingerprint", { length: 64 }).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ quoteOwnerCreatedIdx: index("quote_owner_created_idx").on(table.ownerId, table.createdAt), quoteFingerprintCreatedIdx: index("quote_fingerprint_created_idx").on(table.requestFingerprint, table.createdAt) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
