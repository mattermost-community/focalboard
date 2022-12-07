INSERT INTO {{.prefix}}boards (
      SELECT B.id, B.insert_at, C.TeamId, B.channel_id, B.created_by, B.modified_by, C.Type,
                 COALESCE(B.title, ''),
                 COALESCE(JSON_UNQUOTE(JSON_EXTRACT(B.fields,'$.description')), ''),
                 JSON_UNQUOTE(JSON_EXTRACT(B.fields,'$.icon')),
                 COALESCE(B.fields->'$.showDescription', 'false') = 'true',
                 COALESCE(JSON_EXTRACT(B.fields, '$.isTemplate'), 'false') = 'true',
                 COALESCE(B.fields->'$.templateVer', 0),
                 '{}', B.fields->'$.cardProperties', B.create_at,
                 B.update_at, B.delete_at
          FROM {{.prefix}}blocks AS B
          INNER JOIN Channels AS C ON C.Id=B.channel_id
          WHERE B.type='board'
  );