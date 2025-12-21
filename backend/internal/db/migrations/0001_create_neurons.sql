CREATE TABLE IF NOT EXISTS neurons (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name TEXT NOT NULL UNIQUE,
   type TEXT NOT NULL,
   application_name TEXT NOT NULL,
   current_state TEXT NOT NULL,
   desired_state TEXT NOT NULL,
   last_touch DATETIME NOT NULL,
   ping_timing INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_neurons_name ON neurons(name);