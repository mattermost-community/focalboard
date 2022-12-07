INSERT INTO {{.prefix}}board_members (
    SELECT B.Id, CM.UserId, CM.Roles, TRUE, TRUE, FALSE, FALSE
    FROM {{.prefix}}boards AS B
    INNER JOIN ChannelMembers as CM ON CM.ChannelId=B.channel_id
    WHERE CM.SchemeAdmin=True OR (CM.UserId=B.created_by)
);