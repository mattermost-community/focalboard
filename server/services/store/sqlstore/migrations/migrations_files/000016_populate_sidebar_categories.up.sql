INSERT INTO {{.prefix}}sidebar_categories(name, user_id, team_id, channel_id)
SELECT
    COALESCE(nullif(c.displayname, ''), 'Direct Message') as category_name,
    cm.userid,
    COALESCE(nullif(c.teamid, ''), 'direct_message') as team_id,
    cm.channelid
FROM
    {{.prefix}}blocks blocks
        JOIN channelmembers cm on blocks.workspace_id = cm.channelid AND blocks.type = 'board'
        JOIN channels c on cm.channelid = c.id
GROUP BY cm.userid, c.teamid, cm.channelid, c.displayname;
