CREATE TABLE IF NOT EXISTS fb_workspaces (
	id VARCHAR(36),
	signup_token VARCHAR(100) NOT NULL,
    settings JSON,
	modified_by VARCHAR(36),
	update_at BIGINT,
	PRIMARY KEY (id)
);
