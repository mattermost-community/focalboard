ALTER TABLE blocks
ADD COLUMN workspace_id VARCHAR(36);

ALTER TABLE sharing
ADD COLUMN workspace_id VARCHAR(36);

ALTER TABLE sessions
ADD COLUMN auth_service VARCHAR(20);

UPDATE blocks SET workspace_id = '0' WHERE workspace_id = '' OR workspace_id IS NULL;
