CREATE TABLE {{.prefix}}categories (
    {{if .mysql}}id INT NOT NULL UNIQUE AUTO_INCREMENT,{{end}}
    {{if .postgres}}id SERIAL,{{end}}
    {{if .sqlite}}id varchar(36),{{end}}
    name varchar(100) NOT NULL,
    user_id varchar(32) NOT NULL,
    team_id varchar(32) NOT NULL,
    channel_id varchar(32) NOT NULL,
    {{if .postgres}}create_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),{{end}}
    {{if .sqlite}}create_at DATETIME NOT NULL DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),{{end}}
    {{if .mysql}}create_at DATETIME(6) NOT NULL DEFAULT NOW(6),{{end}}
    update_at BIGINT,
    delete_at BIGINT,
    PRIMARY KEY (id)
    ) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

{{if .plugin}}
    INSERT INTO {{.prefix}}categories(name, user_id, team_id, channel_id)
    SELECT
        COALESCE(nullif(c.DisplayName, ''), 'Direct Message') as category_name,
        cm.UserId,
        COALESCE(nullif(c.TeamId, ''), 'direct_message') as team_id,
        cm.ChannelId
    FROM
        {{.prefix}}blocks blocks
            JOIN ChannelMembers cm on blocks.workspace_id = cm.ChannelId AND blocks.type = 'board'
            JOIN Channels c on cm.ChannelId = c.id
    GROUP BY cm.UserId, c.TeamId, cm.ChannelId, c.DisplayName;

    {{if .mysql}}
        ALTER TABLE {{.prefix}}categories MODIFY id varchar(36);
    {{end}}

    {{if .postgres}}
        ALTER TABLE {{.prefix}}categories ALTER COLUMN id TYPE varchar(36);
        ALTER TABLE {{.prefix}}categories ALTER COLUMN id DROP DEFAULT;
    {{end}}
{{end}}
