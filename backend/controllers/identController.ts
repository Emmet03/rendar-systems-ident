import type { Ident } from "../models/identModel";
import { getDb } from "../utils/db";

export class IdentController {
  createIdent(identData: Ident) {
    const db = getDb();

    const stmt = db.prepare(`
      INSERT INTO idents (
        id, name, species, age, homeWorld, occupation, dangerLevel, description, bankAccountBalance
      ) VALUES (
        @id, @name, @species, @age, @homeWorld, @occupation, @dangerLevel, @description, @bankAccountBalance
      )
    `);

    stmt.run({
      ...identData,
      bankAccountBalance: identData.BankAccountBalance
    });

    return { ok: true };
  }

  getIdentById(id: string): Ident | null {
    const db = getDb();

    const row = db.prepare(`SELECT * FROM idents WHERE id = ?`).get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      species: row.species,
      age: row.age,
      homeWorld: row.homeWorld,
      occupation: row.occupation,
      dangerLevel: row.dangerLevel,
      description: row.description,
      BankAccountBalance: row.bankAccountBalance
    };
  }

  updateBalance(id: string, delta: number) {
    const db = getDb();

    const res = db
      .prepare(`UPDATE idents SET bankAccountBalance = bankAccountBalance + ? WHERE id = ?`)
      .run(delta, id);

    if (res.changes === 0) return { ok: false, error: "NOT_FOUND" as const };

    const row = db.prepare(`SELECT bankAccountBalance FROM idents WHERE id = ?`).get(id) as any;
    return { ok: true, balance: row.bankAccountBalance as number };
  }

  // ADMIN: kompletter edit / upsert (ohne Passwort)
  upsertIdentAdmin(data: Ident) {
    const db = getDb();

    db.prepare(`
      INSERT INTO idents (
        id, name, species, age, homeWorld, occupation, dangerLevel, description, bankAccountBalance
      ) VALUES (
        @id, @name, @species, @age, @homeWorld, @occupation, @dangerLevel, @description, @bankAccountBalance
      )
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        species=excluded.species,
        age=excluded.age,
        homeWorld=excluded.homeWorld,
        occupation=excluded.occupation,
        dangerLevel=excluded.dangerLevel,
        description=excluded.description,
        bankAccountBalance=excluded.bankAccountBalance
    `).run({
      ...data,
      bankAccountBalance: data.BankAccountBalance
    });

    return { ok: true };
  }

  // IMPERIUM: nur dangerLevel edit
  setDangerLevelImperial(id: string, dangerLevel: number) {
    const db = getDb();
    const res = db.prepare(`UPDATE idents SET dangerLevel = ? WHERE id = ?`).run(dangerLevel, id);
    if (res.changes === 0) return { ok: false as const, error: "NOT_FOUND" as const };
    return { ok: true as const };
  }

  // BAR: Kauf eintragen + balance abziehen + Kauf-Liste zurückgeben (optional)
  addPurchase(id: string, item: string, amount: number, note?: string) {
    const db = getDb();

    const get = db.prepare(`SELECT id, bankAccountBalance FROM idents WHERE id = ?`);
    const dec = db.prepare(`UPDATE idents SET bankAccountBalance = bankAccountBalance - ? WHERE id = ?`);
    const ins = db.prepare(`INSERT INTO purchases (ident_id, item, amount, note) VALUES (?, ?, ?, ?)`);

    const tx = db.transaction(() => {
      const row = get.get(id) as any;
      if (!row) return { ok: false as const, error: "NOT_FOUND" as const };

      const balance = row.bankAccountBalance as number;
      if (balance < amount) return { ok: false as const, error: "INSUFFICIENT_FUNDS" as const, balance };

      dec.run(amount, id);
      ins.run(id, item, amount, note ?? null);

      const updated = get.get(id) as any;

      return { ok: true as const, balance: updated.bankAccountBalance as number };
    });

    return tx();
  }

  // (Optional) Liste der Käufe für Anzeige
  listPurchases(id: string, limit = 50) {
    const db = getDb();
    return db.prepare(`
      SELECT ts, item, amount, note
      FROM purchases
      WHERE ident_id = ?
      ORDER BY ts DESC
      LIMIT ?
    `).all(id, limit);
  }

  listAllIdents() {
  const db = getDb();

  return db.prepare(`
    SELECT
      id,
      name,
      species,
      age,
      homeWorld,
      occupation,
      dangerLevel,
      description,
      bankAccountBalance
    FROM idents
    ORDER BY name COLLATE NOCASE
  `).all().map((row: any) => ({
    id: row.id,
    name: row.name,
    species: row.species,
    age: row.age,
    homeWorld: row.homeWorld,
    occupation: row.occupation,
    dangerLevel: row.dangerLevel,
    description: row.description,
    BankAccountBalance: row.bankAccountBalance
  }));
}


}
