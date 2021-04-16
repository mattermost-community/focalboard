ALTER TABLE fb_blocks
DROP COLUMN workspace_id;

ALTER TABLE fb_sharing
DROP COLUMN workspace_id;

ALTER TABLE fb_sessions
DROP COLUMN auth_service;
