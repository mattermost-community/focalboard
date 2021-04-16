ALTER TABLE fb_blocks
ADD COLUMN workspace_id VARCHAR(36);

ALTER TABLE fb_sharing
ADD COLUMN workspace_id VARCHAR(36);

ALTER TABLE fb_sessions
ADD COLUMN auth_service VARCHAR(20);

UPDATE fb_blocks SET workspace_id = '0' WHERE workspace_id = '' OR workspace_id IS NULL;
