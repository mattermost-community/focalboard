ALTER TABLE {{.prefix}}blocks DROP COLUMN board_id VARCHAR(36);
ALTER TABLE {{.prefix}}blocks RENAME COLUMN channel_id TO workspace_id;
ALTER TABLE {{.prefix}}blocks_history DROP COLUMN board_id VARCHAR(36);
ALTER TABLE {{.prefix}}blocks_history RENAME COLUMN channel_id TO workspace_id;
ALTER TABLE {{.prefix}}teams RENAME TO {{.prefix}}workspaces;

/* TODO: Re-create the board blocks from the boards table */ 
/* INSERT INTO {{.prefix}}blocks (SELECT ... FROM {{.prefix}}boards AS B) */

DROP TABLE {{.prefix}}board_members
DROP TABLE {{.prefix}}boards
