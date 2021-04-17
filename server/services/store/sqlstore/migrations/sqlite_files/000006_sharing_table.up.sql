CREATE TABLE IF NOT EXISTS {{.prefix}}sharing (
	id VARCHAR(36),
	enabled BOOLEAN,
	token VARCHAR(100),
	modified_by VARCHAR(36),
	update_at BIGINT,
	PRIMARY KEY (id)
);
