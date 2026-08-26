CREATE TABLE IF NOT EXISTS execution_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    execution_id INTEGER NOT NULL,
    sequence INTEGER NOT NULL,
    timestamp DATETIME NOT NULL,
    source TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE,
    UNIQUE (execution_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_execution_logs_execution_sequence
ON execution_logs(execution_id, sequence);
