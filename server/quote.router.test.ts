import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { createQuoteRequest, getQuoteRequestForActor, listQuoteRequestsForOwner, listQuoteRequestsForAdmin } = vi.hoisted(() => ({
  createQuoteRequest: vi.fn(),
  getQuoteRequestForActor: vi.fn(),
  listQuoteRequestsForOwner: vi.fn(),
  listQuoteRequestsForAdmin: vi.fn(),
}));

vi.mock("./db", () => ({
  createQuoteRequest,
  listQuoteRequestsForOwner,
  listQuoteRequestsForAdmin,
  getQuoteRequestForActor,
}));

import { appRouter } from "./routers";

const validQuote = {
  name: "Ana Ruta",
  phone: "+1 (555) 123-4567",
  email: "ana@example.com",
  cargo: "Remolque de viaje" as const,
  origin: "Austin",
  destination: "Denver",
  details: "Unidad de 30 pies",
  website: "",
};

function contextFor(role: "user" | "admin", userId = 2): TrpcContext {
  return {
    user: { id: userId, openId: `user-${userId}`, name: "Usuario", email: "usuario@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", ip: "203.0.113.7", headers: { "user-agent": "integration-test" }, get: (name: string) => name === "user-agent" ? "integration-test" : undefined } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("quote router integration", () => {
  beforeEach(() => {
    createQuoteRequest.mockReset().mockResolvedValue({ id: "2c6b9c5e-67b2-4e46-ae2c-2a5ef8cc6ab9" });
    getQuoteRequestForActor.mockReset().mockResolvedValue({ id: "2c6b9c5e-67b2-4e46-ae2c-2a5ef8cc6ab9", cargo: "Remolque de viaje", status: "new", createdAt: new Date(), contact: { name: "Ana Ruta", phone: "+1 (555) 123-4567", email: "ana@example.com" }, route: { origin: "Austin", destination: "Denver", details: "Unidad de 30 pies" } });
    listQuoteRequestsForOwner.mockReset().mockResolvedValue([]);
    listQuoteRequestsForAdmin.mockReset().mockResolvedValue([]);
  });

  it("persists a validated request under the authenticated owner only", async () => {
    const owner = contextFor("user", 22);
    const result = await appRouter.createCaller(owner).quote.create(validQuote);

    expect(result).toEqual({ id: "2c6b9c5e-67b2-4e46-ae2c-2a5ef8cc6ab9" });
    expect(createQuoteRequest).toHaveBeenCalledWith(22, expect.objectContaining({ name: "Ana Ruta", cargo: "Remolque de viaje" }), expect.stringMatching(/^[a-f0-9]{64}$/));
    await appRouter.createCaller(owner).quote.mine();
    expect(listQuoteRequestsForOwner).toHaveBeenCalledWith(22);
  });

  it("does not expose the complete request list to a regular user", async () => {
    await expect(appRouter.createCaller(contextFor("user")).quote.all()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(contextFor("admin", 1)).quote.all()).resolves.toEqual([]);
    expect(listQuoteRequestsForAdmin).toHaveBeenCalledTimes(1);
  });

  it("passes the authenticated actor into the record lookup so the data layer can enforce owner or admin scope", async () => {
    const id = "2c6b9c5e-67b2-4e46-ae2c-2a5ef8cc6ab9";
    const owner = contextFor("user", 22);
    await expect(appRouter.createCaller(owner).quote.byId({ id })).resolves.toMatchObject({ id, contact: { email: "ana@example.com" } });
    expect(getQuoteRequestForActor).toHaveBeenLastCalledWith(id, expect.objectContaining({ id: 22, role: "user" }));

    await expect(appRouter.createCaller(contextFor("admin", 1)).quote.byId({ id })).resolves.toMatchObject({ id });
    expect(getQuoteRequestForActor).toHaveBeenLastCalledWith(id, expect.objectContaining({ id: 1, role: "admin" }));
  });
});
