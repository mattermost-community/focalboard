CREATE TABLE IF NOT EXISTS {{.prefix}}workspaces (
	id VARCHAR(36),
	signup_token VARCHAR(100) NOT NULL,
	settings {{if .postgres}}JSON{{else}}TEXT{{end}},
	modified_by VARCHAR(36),
	update_at BIGINT,
	PRIMARY KEY (id)
){{if .mysql}}CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci{{end}};
