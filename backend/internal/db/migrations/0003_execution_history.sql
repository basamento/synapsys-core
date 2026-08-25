BEGIN IMMEDIATE;

ALTER TABLE actions RENAME TO actions_legacy;
ALTER TABLE executions RENAME TO executions_legacy;
DROP INDEX idx_actions_execution_id;
DROP INDEX idx_executions_process_id;

CREATE TABLE executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_id INTEGER NOT NULL,
    run_id INTEGER NULL,
    created_at DATETIME NOT NULL,
    modified_at DATETIME NOT NULL,
    current_status TEXT NOT NULL,
    desired_state TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE
);

INSERT INTO executions (
    id,
    process_id,
    run_id,
    created_at,
    modified_at,
    current_status,
    desired_state,
    status
)
SELECT
    e.id,
    e.process_id,
    p.run_id,
    e.created_at,
    e.modified_at,
    e.current_status,
    e.desired_state,
    CASE
        WHEN e.current_status IN ('running', 'stopping') THEN 'active'
        ELSE 'inactive'
    END
FROM executions_legacy e
INNER JOIN processes p ON p.id = e.process_id;

CREATE INDEX idx_executions_process_id ON executions(process_id);
CREATE UNIQUE INDEX idx_executions_one_active_per_process
    ON executions(process_id)
    WHERE status = 'active';

CREATE TABLE actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    execution_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    status TEXT NOT NULL,
    type TEXT NOT NULL,
    FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

INSERT INTO actions (id, execution_id, created_at, status, type)
SELECT id, execution_id, created_at, status, type
FROM actions_legacy;

CREATE INDEX idx_actions_execution_id ON actions(execution_id);

DROP TABLE actions_legacy;
DROP TABLE executions_legacy;

COMMIT;
