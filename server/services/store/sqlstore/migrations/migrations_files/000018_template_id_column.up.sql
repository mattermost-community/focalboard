ALTER TABLE {{.prefix}}boards ADD COLUMN template_id VARCHAR(36);
ALTER TABLE {{.prefix}}boards_history ADD COLUMN template_id VARCHAR(36);


