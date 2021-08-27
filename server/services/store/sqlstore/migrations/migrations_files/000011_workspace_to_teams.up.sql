ALTER TABLE {{.prefix}}workspaces RENAME TO {{.prefix}}teams;
ALTER TABLE {{.prefix}}blocks RENAME COLUMN workspace_id TO channel_id;
ALTER TABLE {{.prefix}}blocks ADD COLUMN team_id VARCHAR(36);

{{if .plugin}}
CREATE TABLE {{.prefix}board_members (
    boardId character varying(26) NOT NULL,
    userId character varying(26) NOT NULL,
    roles character varying(64),
    schemeAdmin boolean,
    schemeEditor boolean,
    schemeCommenter boolean,
    schemeViewer boolean,
    lastviewedat bigint,
    mentioncount bigint,
    {{if .mysql}}
    notifyprops json,
    {{else}}
    notifyprops jsonb,
    {{end}}
    notifyprops jsonb,
	PRIMARY KEY (boardId, userId)
);

CREATE INDEX idx_boardmembers_user_id ON {{.prefix}}board_members(userId);

INSERT INTO {{.prefix}}board_members (SELECT B.Id, CM.UserId, CM.SchemeAdmin, CM.SchemeUser, CM.SchemeGuest, FALSE, 0, 0, '{}' FROM {{.prefix}}blocks AS B WHERE B.type='board' INNER JOIN ChannelMembers as CM ON CM.ChannelId=B.channel_id);

{{if .mysql}}
UPDATE {{.prefix}}blocks as B, Channels as C ON C.Id=B.channel_id SET team_id = C.teamId;
{{end}}
{{if .postgres}}
UPDATE {{.prefix}}blocks as B SET team_id = C.teamId FROM Channels as C WHERE C.Id=B.channel_id;
{{end}}
{{else}}
UPDATE {{.prefix}}blocks as B SET team_id = '0';
{{end}}
