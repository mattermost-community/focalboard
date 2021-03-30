ALTER TABLE blocks
DROP COLUMN workspace_id;

ALTER TABLE sharing
DROP COLUMN workspace_id;

ALTER TABLE sessions
DROP COLUMN auth_service;
