ALTER TABLE {{.prefix}}blocks
DROP COLUMN workspace_id;

ALTER TABLE {{.prefix}}sharing
DROP COLUMN workspace_id;

ALTER TABLE {{.prefix}}sessions
DROP COLUMN auth_service;
