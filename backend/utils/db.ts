import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DB_PATH ?? "./data/event.sqlite";

let db: Database.Database | null = null;

export function getDb() {
  if (db) return db;

  // ensure folder exists
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  db = new Database(DB_PATH);
  db.pragma("foreign_keys = ON");
  return db;
}

export function initDb() {
  const database = getDb();
  const schemaPath = path.join(process.cwd(), "utils", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  database.exec(schema);
}
