CREATE TABLE {{.prefix}}categories (
    {{if .mysql}}id INT NOT NULL UNIQUE AUTO_INCREMENT,{{end}}
    {{if .postgres}}id SERIAL,{{end}}
    {{if .sqlite}}id varchar(36),{{end}}
    name varchar(100) NOT NULL,
    user_id varchar(32) NOT NULL,
    team_id varchar(32) NOT NULL,
    {{if not .sqlite}}
        channel_id varchar(32) NOT NULL,
    {{end}}
    create_at BIGINT,
    update_at BIGINT,
    delete_at BIGINT,
    PRIMARY KEY (id)
    ) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

{{if .plugin}}
    INSERT INTO {{.prefix}}categories(
        name,
        user_id,
        team_id,
        {{if not .sqlite}}channel_id,{{end}}
        create_at,
        update_at,
        delete_at
    )
    SELECT
        COALESCE(nullif(c.DisplayName, ''), 'Direct Message') as category_name,
        cm.UserId,
        COALESCE(nullif(c.TeamId, ''), 'direct_message') as team_id,
        {{if not .sqlite}}cm.ChannelId,{{end}}
        {{if .postgres}}(extract(epoch from now())*1000)::bigint,{{end}}
        {{if .mysql}}UNIX_TIMESTAMP() * 1000,{{end}}
        {{if .sqlite}}CAST(strftime('%s', 'now') * 1000 as bigint),{{end}}
        0,
        0
    FROM
        {{.prefix}}boards boards
            JOIN ChannelMembers cm on boards.channel_id = cm.ChannelId
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
