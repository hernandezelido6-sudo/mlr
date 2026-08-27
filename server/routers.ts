import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { consumeRateLimit, getRequestFingerprint, isEncryptionConfigured, quoteRequestInputSchema } from "./security";

export const appRouter = router({
  system: systemRouter,
  auth: router({ me: publicProcedure.query(opts => opts.ctx.user), logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }) }),
  security: router({
    encryptionStatus: adminProcedure.query(() => {
      if (!isEncryptionConfigured()) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Encryption is not configured" });
      return { encryptionReady: true } as const;
    }),
  }),
  quote: router({
    create: protectedProcedure.input(quoteRequestInputSchema).mutation(async ({ ctx, input }) => {
      const fingerprint = getRequestFingerprint(ctx.req); if (!consumeRateLimit(`quote:${fingerprint}`, 3, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many quote requests" });
      if (input.website) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid request" }); return db.createQuoteRequest(ctx.user.id, input, fingerprint);
    }),
    mine: protectedProcedure.query(({ ctx }) => db.listQuoteRequestsForOwner(ctx.user.id)),
    byId: protectedProcedure.input(z.object({ id: z.string().uuid() }).strict()).query(async ({ ctx, input }) => { const request = await db.getQuoteRequestForActor(input.id, ctx.user); if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Quote request not found" }); return request; }),
    all: adminProcedure.query(() => db.listQuoteRequestsForAdmin()),
  }),
});
export type AppRouter = typeof appRouter;
