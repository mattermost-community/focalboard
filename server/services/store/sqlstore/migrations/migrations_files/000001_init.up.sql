CREATE TABLE IF NOT EXISTS {{.prefix}}blocks (
	id VARCHAR(36),
	insert_at {{if .postgres}}TIMESTAMPTZ NOT NULL DEFAULT NOW(){{else}}DATETIME NOT NULL DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')){{end}},
	parent_id VARCHAR(36),
	schema BIGINT,
	type TEXT,
	title TEXT,
	fields {{if .postgres}}JSON{{else}}TEXT{{end}},
	create_at BIGINT,
	update_at BIGINT,
	delete_at BIGINT,
	PRIMARY KEY (id, insert_at)
);
