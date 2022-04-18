CREATE TABLE {{.prefix}}categories (
    id varchar(36) NOT NULL,
    name varchar(100) NOT NULL,
    user_id varchar(36) NOT NULL,
    team_id varchar(36) NOT NULL,
    channel_id varchar(36),
    create_at BIGINT,
    update_at BIGINT,
    delete_at BIGINT,
    PRIMARY KEY (id)
    ) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

CREATE INDEX idx_categories_user_id_team_id ON {{.prefix}}categories(user_id, team_id);

{{if .plugin}}
    INSERT INTO {{.prefix}}categories(
        id,
        name,
        user_id,
        team_id,
        channel_id,
        create_at,
        update_at,
        delete_at
    )
    SELECT
        {{ if .postgres }}
            REPLACE(uuid_in(md5(random()::text || clock_timestamp()::text)::cstring)::varchar, '-', ''),
        {{ end }}
        {{ if .mysql }}
            UUID(),
        {{ end }}
        c.DisplayName,
        cm.UserId,
        c.TeamId,
        cm.ChannelId,
        {{if .postgres}}(extract(epoch from now())*1000)::bigint,{{end}}
        {{if .mysql}}UNIX_TIMESTAMP() * 1000,{{end}}
        0,
        0
    FROM
        {{.prefix}}boards boards
            JOIN ChannelMembers cm on boards.channel_id = cm.ChannelId
            JOIN Channels c on cm.ChannelId = c.id and (c.Type = 'O' or c.Type = 'P')
    GROUP BY cm.UserId, c.TeamId, cm.ChannelId, c.DisplayName;
{{end}}
