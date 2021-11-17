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
{{end}}
