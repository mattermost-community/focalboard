ALTER TABLE {{.prefix}}boards ADD COLUMN template_version INT NOT NULL DEFAULT 0;
ALTER TABLE {{.prefix}}boards ADD COLUMN template_tracking_code VARCHAR(36) NOT NULL DEFAULT '';
ALTER TABLE {{.prefix}}boards_history ADD COLUMN template_version INT NOT NULL DEFAULT 0;
ALTER TABLE {{.prefix}}boards_history ADD COLUMN template_tracking_code VARCHAR(36) NOT NULL DEFAULT '';
