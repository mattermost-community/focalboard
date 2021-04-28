CREATE TABLE IF NOT EXISTS {{.prefix}}sharing (
	id VARCHAR(36),
	enabled BOOLEAN,
	token VARCHAR(100),
	modified_by VARCHAR(36),
	update_at BIGINT,
	PRIMARY KEY (id)
){{if .mysql}}CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci{{end}};
