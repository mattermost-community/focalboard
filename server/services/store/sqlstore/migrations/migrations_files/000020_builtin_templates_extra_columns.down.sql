ALTER TABLE {{.prefix}}boards DROP COLUMN template_version;
ALTER TABLE {{.prefix}}boards DROP COLUMN template_tracking_code;
ALTER TABLE {{.prefix}}boards_history DROP COLUMN template_version;
ALTER TABLE {{.prefix}}boards_history DROP COLUMN template_tracking_code;
