ALTER TABLE blocks
ADD COLUMN workspace_id VARCHAR(36);

ALTER TABLE sharing
ADD COLUMN workspace_id VARCHAR(36);

ALTER TABLE sessions
ADD COLUMN auth_service VARCHAR(20);
