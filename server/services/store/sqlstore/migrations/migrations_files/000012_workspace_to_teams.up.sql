ALTER TABLE {{.prefix}}workspaces RENAME TO {{.prefix}}teams;
ALTER TABLE {{.prefix}}blocks RENAME COLUMN workspace_id TO channel_id;
ALTER TABLE {{.prefix}}blocks ADD COLUMN board_id VARCHAR(26);
ALTER TABLE {{.prefix}}blocks_history RENAME COLUMN workspace_id TO channel_id;
ALTER TABLE {{.prefix}}blocks_history ADD COLUMN board_id VARCHAR(26);

{{if .mysql}}
ALTER TABLE {{.prefix}}users CHANGE props props JSON;
ALTER TABLE {{.prefix}}sessions CHANGE props props JSON;
ALTER TABLE {{.prefix}}blocks CHANGE fields fields JSON;
ALTER TABLE {{.prefix}}blocks_history CHANGE fields fields JSON;
ALTER TABLE {{.prefix}}teams CHANGE settings settings JSON;
{{end}}

CREATE TABLE {{.prefix}}boards (
    id VARCHAR(26) NOT NULL PRIMARY KEY,
    team_id VARCHAR(26) NOT NULL,
    channel_id VARCHAR(26),
    creatord_id VARCHAR(26) NOT NULL,
    title TEXT,
    description TEXT,
    icon VARCHAR(256),
    type VARCHAR(1) NOT NULL,
    show_description BOOLEAN,
    is_template BOOLEAN,
    scheme_id VARCHAR(26),
    {{if .mysql}}
    properties JSON,
    card_properties JSON,
    column_calculations JSON,
    {{end}}
	{{if .postgres}}
    properties JSONB,
    card_properties JSONB,
    column_calculations JSONB,
    {{end}}
	{{if .sqlite}}
    properties TEXT,
    card_properties TEXT,
    column_calculations TEXT,
    {{end}}
	create_at BIGINT,
	update_at BIGINT,
	delete_at BIGINT
);

CREATE TABLE {{.prefix}}boards_history (
    id VARCHAR(26) NOT NULL PRIMARY KEY,
    team_id VARCHAR(26) NOT NULL,
    channel_id VARCHAR(26),
    creatord_id VARCHAR(26) NOT NULL,
    title TEXT,
    description TEXT,
    icon VARCHAR(256),
    type VARCHAR(1) NOT NULL,
    show_description BOOLEAN,
    is_template BOOLEAN,
    scheme_id VARCHAR(26),
    {{if .mysql}}
    properties JSON,
    card_properties JSON,
    column_calculations JSON,
    {{end}}
	{{if .postgres}}
    properties JSONB,
    card_properties JSONB,
    column_calculations JSONB,
    {{end}}
	{{if .sqlite}}
    properties TEXT,
    card_properties TEXT,
    column_calculations TEXT,
    {{end}}
	create_at BIGINT,
	update_at BIGINT,
	delete_at BIGINT
);

{{if .plugin}}
INSERT INTO {{.prefix}}boards (SELECT B.Id, C.TeamId, B.channel_id, B.creator_id, B.title, B.fields.description, B.fields.icon, B.fields.description, B.fields.show_description, B.fields.is_template, '{}', B.fields.card_properties, B.fields.column_calculations, B.create_at, B.update_at, B.delete_at FROM {{.prefix}}blocks AS B INNER JOIN Channel as C ON C.Id=B.channel_id WHERE B.type='board')
INSERT INTO {{.prefix}}boards_history (SELECT B.Id, C.TeamId, B.channel_id, B.creator_id, B.title, B.fields.description, B.fields.icon, B.fields.description, B.fields.show_description, B.fields.is_template, '{}', B.fields.card_properties, B.fields.column_calculations, B.create_at, B.update_at, B.delete_at FROM {{.prefix}}blocks_history AS B INNER JOIN Channel as C ON C.Id=B.channel_id WHERE B.type='board')
{{else}}
INSERT INTO {{.prefix}}boards (SELECT B.Id, '0', B.channel_id, B.creator_id, B.title, B.fields.description, B.fields.icon, B.fields.description, B.fields.show_description, B.fields.is_template, '{}', B.fields.card_properties, B.fields.column_calculations, B.create_at, B.update_at, B.delete_at FROM {{.prefix}}blocks AS B WHERE B.type='board')
INSERT INTO {{.prefix}}boards_history (SELECT B.Id, '0', B.channel_id, B.creator_id, B.title, B.fields.description, B.fields.icon, B.fields.description, B.fields.show_description, B.fields.is_template, '{}', B.fields.card_properties, B.fields.column_calculations, B.create_at, B.update_at, B.delete_at FROM {{.prefix}}blocks_history AS B WHERE B.type='board')
{{end}}

{{if .mysql}}
UPDATE {{.prefix}}blocks as B, {{.prefix}}blocks as P ON P.Id=B.parent_id SET B.board_id=P.id WHERE P.type = 'board';
UPDATE {{.prefix}}blocks as B, {{.prefix}}blocks as P ON P.Id=B.parent_id, {{.prefix}}blocks as GP ON GP.Id=P.parent_id SET B.board_id=GP.id WHERE GP.type = 'board';
UPDATE {{.prefix}}blocks as B, {{.prefix}}blocks as P ON P.Id=B.parent_id, {{.prefix}}blocks as GP ON GP.Id=P.parent_id, {{.prefix}}blocks as GGP ON GGP.Id=GP.parent_id SET B.board_id=GGP.id WHERE GGP.type = 'board';
UPDATE {{.prefix}}blocks_history as B, {{.prefix}}blocks_history as P ON P.Id=B.parent_id SET B.board_id=P.id WHERE P.type = 'board';
UPDATE {{.prefix}}blocks_history as B, {{.prefix}}blocks_history as P ON P.Id=B.parent_id, {{.prefix}}blocks_history as GP ON GP.Id=P.parent_id SET B.board_id=GP.id WHERE GP.type = 'board';
UPDATE {{.prefix}}blocks_history as B, {{.prefix}}blocks_history as P ON P.Id=B.parent_id, {{.prefix}}blocks_history as GP ON GP.Id=P.parent_id, {{.prefix}}blocks_history as GGP ON GGP.Id=GP.parent_id SET B.board_id=GGP.id WHERE GGP.type = 'board';
{{end}}
{{if .sqlite}}
UPDATE {{.prefix}}blocks as B, {{.prefix}}blocks as P ON P.Id=B.parent_id SET B.board_id=P.id WHERE P.type = 'board';
UPDATE {{.prefix}}blocks as B, {{.prefix}}blocks as P ON P.Id=B.parent_id, {{.prefix}}blocks as GP ON GP.Id=P.parent_id SET B.board_id=GP.id WHERE GP.type = 'board';
UPDATE {{.prefix}}blocks as B, {{.prefix}}blocks as P ON P.Id=B.parent_id, {{.prefix}}blocks as GP ON GP.Id=P.parent_id, {{.prefix}}blocks as GGP ON GGP.Id=GP.parent_id SET B.board_id=GGP.id WHERE GGP.type = 'board';
UPDATE {{.prefix}}blocks_history as B, {{.prefix}}blocks_history as P ON P.Id=B.parent_id SET B.board_id=P.id WHERE P.type = 'board';
UPDATE {{.prefix}}blocks_history as B, {{.prefix}}blocks_history as P ON P.Id=B.parent_id, {{.prefix}}blocks_history as GP ON GP.Id=P.parent_id SET B.board_id=GP.id WHERE GP.type = 'board';
UPDATE {{.prefix}}blocks_history as B, {{.prefix}}blocks_history as P ON P.Id=B.parent_id, {{.prefix}}blocks_history as GP ON GP.Id=P.parent_id, {{.prefix}}blocks_history as GGP ON GGP.Id=GP.parent_id SET B.board_id=GGP.id WHERE GGP.type = 'board';
{{end}}
{{if .postgres}}
UPDATE {{.prefix}}blocks as B SET B.board_id=P.id FROM {{.prefix}}blocks as P WHERE P.Id=B.parent_id AND P.type = 'board';
UPDATE {{.prefix}}blocks as B SET B.board_id=GP.id FROM {{.prefix}}blocks as P {{.prefix}}blocks as GP WHERE P.Id=B.parent_id AND GP.Id=P.parent_id AND GP.type = 'board';
UPDATE {{.prefix}}blocks as B SET B.board_id=GGP.id FROM {{.prefix}}blocks as P, {{.prefix}}blocks as GP, {{.prefix}}blocks as GGP WHERE P.Id=B.parent_id AND GP.Id=P.parent_id AND GGP.Id=GP.parent_id AND GGP.type = 'board';
UPDATE {{.prefix}}blocks_history as B SET B.board_id=P.id FROM {{.prefix}}blocks_history as P WHERE P.Id=B.parent_id AND P.type = 'board';
UPDATE {{.prefix}}blocks_history as B SET B.board_id=GP.id FROM {{.prefix}}blocks_history as P {{.prefix}}blocks_history as GP WHERE P.Id=B.parent_id AND GP.Id=P.parent_id AND GP.type = 'board';
UPDATE {{.prefix}}blocks_history as B SET B.board_id=GGP.id FROM {{.prefix}}blocks_history as P, {{.prefix}}blocks_history as GP, {{.prefix}}blocks_history as GGP WHERE P.Id=B.parent_id AND GP.Id=P.parent_id AND GGP.Id=GP.parent_id AND GGP.type = 'board';
{{end}}

DELETE FROM {{.prefix}}blocks WHERE type='board';

{{if .plugin}}
CREATE TABLE {{.prefix}}board_members (
    board_id VARCHAR(26) NOT NULL,
    user_id VARCHAR(26) NOT NULL,
    roles VARCHAR(64),
    scheme_admin boolean,
    scheme_editor boolean,
    scheme_commenter boolean,
    scheme_viewer boolean,
    lastviewedat bigint,
    mention_count bigint,
    {{if .mysql}}
    notify_props json,
    {{else}}
    notify_props jsonb,
    {{end}}
	PRIMARY KEY (boardId, userId)
);

CREATE INDEX idx_boardmembers_user_id ON {{.prefix}}board_members(userId);

INSERT INTO {{.prefix}}board_members (SELECT B.Id, CM.UserId, CM.SchemeAdmin, CM.SchemeUser, CM.SchemeGuest, FALSE, 0, 0, '{}' FROM {{.prefix}}blocks AS B WHERE B.type='board' INNER JOIN ChannelMembers as CM ON CM.ChannelId=B.channel_id);
{{end}}
