CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    first_connection DATETIME NOT NULL,
    last_connection DATETIME NOT NULL,
    framework TEXT NOT NULL,
    host TEXT NOT NULL,
    last_touch DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS processes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    ping_timing INTEGER NOT NULL,
    desired_token INTEGER NOT NULL DEFAULT 0,
    ack_token INTEGER NOT NULL DEFAULT 0,
    run_id INTEGER NULL,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    UNIQUE (worker_id, name)
);

CREATE INDEX IF NOT EXISTS idx_processes_worker_id ON processes(worker_id);
CREATE INDEX IF NOT EXISTS idx_processes_name ON processes(name);


CREATE TABLE IF NOT EXISTS executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_id INTEGER NOT NULL UNIQUE,
    created_at DATETIME NOT NULL,
    modified_at DATETIME NOT NULL,
    current_status TEXT NOT NULL,
    desired_state TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_executions_process_id ON executions(process_id);

CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    execution_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    status TEXT NOT NULL,
    type TEXT NOT NULL,
    FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_actions_execution_id ON actions(execution_id);
