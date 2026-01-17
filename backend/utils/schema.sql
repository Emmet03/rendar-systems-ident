PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS idents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  age INTEGER NOT NULL,
  homeWorld TEXT NOT NULL,
  occupation TEXT NOT NULL,
  dangerLevel INTEGER NOT NULL,
  description TEXT NOT NULL,
  bankAccountBalance INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  ident_id TEXT NOT NULL,
  item TEXT NOT NULL,
  amount INTEGER NOT NULL,
  note TEXT,
  FOREIGN KEY (ident_id) REFERENCES idents(id)
);
