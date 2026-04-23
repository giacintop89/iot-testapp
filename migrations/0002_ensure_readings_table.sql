-- Migration number: 0002
-- Keeps existing databases safe if the starter comments migration was already applied.
CREATE TABLE IF NOT EXISTS readings (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	device TEXT NOT NULL,
	temperature REAL NOT NULL,
	humidity REAL NOT NULL,
	created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_readings_created_at
ON readings(created_at);

CREATE INDEX IF NOT EXISTS idx_readings_device_created_at
ON readings(device, created_at);
