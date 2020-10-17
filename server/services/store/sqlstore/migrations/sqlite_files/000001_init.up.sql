CREATE TABLE IF NOT EXISTS blocks (
	id VARCHAR(36),
	insert_at DATETIME NOT NULL DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
	parent_id VARCHAR(36),
	schema BIGINT,
	type TEXT,
	title TEXT,
	fields TEXT,
	create_at BIGINT,
	update_at BIGINT,
	delete_at BIGINT,
	PRIMARY KEY (id, insert_at)
);
