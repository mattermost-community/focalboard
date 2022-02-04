ALTER TABLE {{.prefix}}boards ADD COLUMN template_version INT DEFAULT 0;
ALTER TABLE {{.prefix}}boards ADD COLUMN template_tracking_code VARCHAR(36) DEFAULT "";
