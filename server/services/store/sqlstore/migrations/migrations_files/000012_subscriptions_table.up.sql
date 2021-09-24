CREATE TABLE IF NOT EXISTS {{.prefix}}subscriptions (
	id VARCHAR(36),
	block_type VARCHAR(10),
	block_id VARCHAR(36),
	subscriber_type VARCHAR(10),
	subscriber_id VARCHAR(36),
	notified_at BIGINT,
	create_at BIGINT,
	delete_at BIGINT,
	PRIMARY KEY (id)
) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};
