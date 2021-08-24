ALTER TABLE {{.prefix}}workspaces RENAME TO {{.prefix}}teams;
ALTER TABLE {{.prefix}}blocks RENAME COLUMN workspace_id TO channel_id;
ALTER TABLE {{.prefix}}blocks ADD COLUMN team_id VARCHAR(36);

{{if .plugin}}
{{if .mysql}}
UPDATE {{.prefix}}blocks as B, Channels as C ON C.Id=B.channel_id SET team_id = C.teamId;
{{end}}
{{if .postgres}}
UPDATE {{.prefix}}blocks as B SET team_id = C.teamId FROM Channels as C WHERE C.Id=B.channel_id;
{{end}}
{{else}}
UPDATE {{.prefix}}blocks as B SET team_id = '0';
{{end}}
