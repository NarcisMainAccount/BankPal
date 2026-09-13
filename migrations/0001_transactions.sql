CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0 AND amount_cents <= 99999999999),
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX transactions_by_date ON transactions(date DESC, created_at DESC, id DESC);
