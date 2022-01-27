ALTER TABLE {{.prefix}}boards DROP COLUMN template_id;
ALTER TABLE {{.prefix}}boards_history DROP COLUMN template_id;
