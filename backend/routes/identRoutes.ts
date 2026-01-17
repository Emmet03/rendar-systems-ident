import { Router } from "express";
import { IdentController } from "../controllers/identController";

export const identRoutes = Router();
const identController = new IdentController();

// --- Basis: create / get / balance ---
identRoutes.post("/idents", (req, res) => {
  try {
    identController.createIdent(req.body);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message ?? "BAD_REQUEST" });
  }
});

identRoutes.get("/idents/:id", (req, res) => {
  const ident = identController.getIdentById(req.params.id);
  if (!ident) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  res.json({ ok: true, ident });
});

identRoutes.post("/idents/:id/balance", (req, res) => {
  const delta = Number(req.body?.delta);
  if (!Number.isInteger(delta)) {
    return res.status(400).json({ ok: false, error: "DELTA_MUST_BE_INT" });
  }

  const result = identController.updateBalance(req.params.id, delta);
  if (!result.ok) return res.status(404).json(result);
  res.json(result);
});

// --- ADMIN: kompletter Edit / Upsert ---
identRoutes.put("/admin/ident", (req, res) => {
  try {
    const result = identController.upsertIdentAdmin(req.body);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e?.message ?? "BAD_REQUEST" });
  }
});

// --- IMPERIUM: dangerLevel edit ---
identRoutes.patch("/imperial/idents/:id/dangerlevel", (req, res) => {
  const dangerLevel = Number(req.body?.dangerLevel);
  if (!Number.isInteger(dangerLevel) || dangerLevel < 0 || dangerLevel > 10) {
    return res.status(400).json({ ok: false, error: "DANGERLEVEL_0_TO_10" });
  }

  const result = identController.setDangerLevelImperial(req.params.id, dangerLevel);
  if (!result.ok) return res.status(404).json(result);
  res.json(result);
});

// --- BAR: Kauf buchen ---
identRoutes.post("/purchase", (req, res) => {
  const id = String(req.body?.id ?? "");
  const item = String(req.body?.item ?? "");
  const amount = Number(req.body?.amount);
  const note = req.body?.note ? String(req.body.note) : undefined;

  if (!id || !item || !Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ ok: false, error: "INVALID_BODY" });
  }

  const result = identController.addPurchase(id, item, amount, note);
  if (!result.ok) {
    const status = result.error === "INSUFFICIENT_FUNDS" ? 409 : 404;
    return res.status(status).json(result);
  }

  res.json(result);
});

// --- Käufe anzeigen ---
identRoutes.get("/idents/:id/purchases", (req, res) => {
  const limit = Number(req.query.limit ?? 50);
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, limit)) : 50;

  const purchases = identController.listPurchases(req.params.id, safeLimit);
  res.json({ ok: true, purchases });
});

// --- ADMIN: alle Nutzer ---
identRoutes.get("/admin/idents", (_req, res) => {
  const idents = identController.listAllIdents();
  res.json({ ok: true, idents });
});
