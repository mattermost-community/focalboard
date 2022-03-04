ALTER TABLE {{.prefix}}blocks
ADD COLUMN workspace_id VARCHAR(36);

ALTER TABLE {{.prefix}}sharing
ADD COLUMN workspace_id VARCHAR(36);

ALTER TABLE {{.prefix}}sessions
ADD COLUMN auth_service VARCHAR(20);

UPDATE {{.prefix}}blocks SET workspace_id = '0' WHERE workspace_id = '' OR workspace_id IS NULL;
