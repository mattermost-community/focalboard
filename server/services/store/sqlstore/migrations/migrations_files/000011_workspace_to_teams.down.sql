ALTER TABLE {{.prefix}}blocks DROP COLUMN team_id VARCHAR(36);
ALTER TABLE {{.prefix}}blocks RENAME COLUMN channel_id TO workspace_id;
ALTER TABLE {{.prefix}}teams RENAME TO {{.prefix}}workspaces;
DROP TABLE {{.prefix}}board_members
