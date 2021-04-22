CREATE TABLE IF NOT EXISTS {{.prefix}}system_settings (
	id VARCHAR(100),
	value TEXT,
	PRIMARY KEY (id)
){{if .mysql}}CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci{{end}};
