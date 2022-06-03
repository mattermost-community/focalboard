{{if .mysql}}
RENAME TABLE {{.prefix}}workspaces TO {{.prefix}}teams;
ALTER TABLE {{.prefix}}blocks CHANGE workspace_id channel_id VARCHAR(36);
ALTER TABLE {{.prefix}}blocks_history CHANGE workspace_id channel_id VARCHAR(36);
{{else}}
ALTER TABLE {{.prefix}}workspaces RENAME TO {{.prefix}}teams;
ALTER TABLE {{.prefix}}blocks RENAME COLUMN workspace_id TO channel_id;
ALTER TABLE {{.prefix}}blocks_history RENAME COLUMN workspace_id TO channel_id;
{{end}}
ALTER TABLE {{.prefix}}blocks ADD COLUMN board_id VARCHAR(36);
ALTER TABLE {{.prefix}}blocks_history ADD COLUMN board_id VARCHAR(36);

{{- /* cleanup incorrect data format in column calculations */ -}}
{{- /* then move from 'board' type to 'view' type*/ -}}
{{if .mysql}}
UPDATE {{.prefix}}blocks SET fields = JSON_SET(fields, '$.columnCalculations', cast('{}' as json)) WHERE fields->'$.columnCalculations' = cast('[]' as json);

UPDATE {{.prefix}}blocks b
  JOIN (
    SELECT id, fields->'$.columnCalculations' as board_calculations from {{.prefix}}blocks
    WHERE fields -> '$.columnCalculations' <> cast('{}' as json)
  ) AS s on s.id = b.root_id
  SET fields = JSON_SET(fields, '$.columnCalculations', cast(s.board_calculations as json))
  WHERE b.fields->'$.viewType' = 'table'
  AND b.type = 'view';
{{end}}
{{if .postgres}}
UPDATE {{.prefix}}blocks SET fields = fields::jsonb - 'columnCalculations' || '{"columnCalculations": {}}' WHERE fields->>'columnCalculations' = '[]';

WITH subquery AS (
  SELECT id, fields->'columnCalculations' as board_calculations from {{.prefix}}blocks
  WHERE fields ->> 'columnCalculations' <> '{}')
UPDATE {{.prefix}}blocks b
    SET fields = b.fields::jsonb|| json_build_object('columnCalculations', s.board_calculations::jsonb)::jsonb
    FROM subquery AS s
    WHERE s.id = b.root_id
    AND b.fields ->> 'viewType' = 'table'
    AND b.type = 'view';
{{end}}
{{if .sqlite}}
UPDATE {{.prefix}}blocks SET fields = replace(fields, '"columnCalculations":[]', '"columnCalculations":{}');

UPDATE {{.prefix}}blocks AS b
    SET fields = (
        SELECT  json_set(a.fields, '$.columnCalculations',json_extract(c.fields,  '$.columnCalculations')) from {{.prefix}}blocks AS a
        JOIN {{.prefix}}blocks AS c on c.id = a.root_id
        WHERE a.id = b.id)
    WHERE json_extract(b.fields,'$.viewType') = 'table'
    AND b.type = 'view';
{{end}}

/* TODO: Migrate the columnCalculations at app level and remove it from the boards and boards_history tables */

{{- /* add boards tables */ -}}
CREATE TABLE {{.prefix}}boards (
    id VARCHAR(36) NOT NULL PRIMARY KEY,

    {{if .postgres}}insert_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),{{end}}
	{{if .sqlite}}insert_at DATETIME NOT NULL DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),{{end}}
	{{if .mysql}}insert_at DATETIME(6) NOT NULL DEFAULT NOW(6),{{end}}

    team_id VARCHAR(36) NOT NULL,
    channel_id VARCHAR(36),
    created_by VARCHAR(36),
    modified_by VARCHAR(36),
    type VARCHAR(1) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon VARCHAR(256),
    show_description BOOLEAN,
    is_template BOOLEAN,
    template_version INT DEFAULT 0,
    {{if .mysql}}
    properties JSON,
    card_properties JSON,
    {{end}}
    {{if .postgres}}
    properties JSONB,
    card_properties JSONB,
    {{end}}
    {{if .sqlite}}
    properties TEXT,
    card_properties TEXT,
    {{end}}
    create_at BIGINT,
    update_at BIGINT,
    delete_at BIGINT
) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

CREATE INDEX idx_board_team_id ON {{.prefix}}boards(team_id, is_template);

CREATE TABLE {{.prefix}}boards_history (
    id VARCHAR(36) NOT NULL,

    {{if .postgres}}insert_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),{{end}}
	{{if .sqlite}}insert_at DATETIME NOT NULL DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),{{end}}
	{{if .mysql}}insert_at DATETIME(6) NOT NULL DEFAULT NOW(6),{{end}}

    team_id VARCHAR(36) NOT NULL,
    channel_id VARCHAR(36),
    created_by VARCHAR(36),
    modified_by VARCHAR(36),
    type VARCHAR(1) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon VARCHAR(256),
    show_description BOOLEAN,
    is_template BOOLEAN,
    template_version INT DEFAULT 0,
    {{if .mysql}}
    properties JSON,
    card_properties JSON,
    {{end}}
    {{if .postgres}}
    properties JSONB,
    card_properties JSONB,
    {{end}}
    {{if .sqlite}}
    properties TEXT,
    card_properties TEXT,
    {{end}}
    create_at BIGINT,
    update_at BIGINT,
    delete_at BIGINT,

    PRIMARY KEY (id, insert_at)
) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};


{{- /* migrate board blocks to boards table */ -}}
{{if .plugin}}
  {{if .postgres}}
  INSERT INTO {{.prefix}}boards (
      SELECT B.id, B.insert_at, C.TeamId, B.channel_id, B.created_by, B.modified_by, C.type,
                 COALESCE(B.title, ''),
                (B.fields->>'description')::text,
                 B.fields->>'icon',
                 COALESCE((fields->'showDescription')::text::boolean, false),
                 COALESCE((fields->'isTemplate')::text::boolean, false),
                 COALESCE((B.fields->'templateVer')::text::int, 0),
                 '{}', B.fields->'cardProperties', B.create_at,
                 B.update_at, B.delete_at
          FROM {{.prefix}}blocks AS B
          INNER JOIN channels AS C ON C.Id=B.channel_id
          WHERE B.type='board'
  );
  INSERT INTO {{.prefix}}boards_history (
      SELECT B.id, B.insert_at, C.TeamId, B.channel_id, B.created_by, B.modified_by, C.type,
                 COALESCE(B.title, ''),
                 (B.fields->>'description')::text,
                 B.fields->>'icon',
                 COALESCE((fields->'showDescription')::text::boolean, false),
                 COALESCE((fields->'isTemplate')::text::boolean, false),
                 COALESCE((B.fields->'templateVer')::text::int, 0),
                 '{}', B.fields->'cardProperties', B.create_at,
                 B.update_at, B.delete_at
          FROM {{.prefix}}blocks_history AS B
          INNER JOIN channels AS C ON C.Id=B.channel_id
          WHERE B.type='board'
  );
  {{end}}
  {{if .mysql}}
  INSERT INTO {{.prefix}}boards (
      SELECT B.id, B.insert_at, C.TeamId, B.channel_id, B.created_by, B.modified_by, C.Type,
                 COALESCE(B.title, ''),
                 JSON_UNQUOTE(JSON_EXTRACT(B.fields,'$.description')),
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
  INSERT INTO {{.prefix}}boards_history (
      SELECT B.id, B.insert_at, C.TeamId, B.channel_id, B.created_by, B.modified_by, C.Type,
                 COALESCE(B.title, ''),
                 JSON_UNQUOTE(JSON_EXTRACT(B.fields,'$.description')),
                 JSON_UNQUOTE(JSON_EXTRACT(B.fields,'$.icon')),
                 COALESCE(B.fields->'$.showDescription', 'false') = 'true',
                 COALESCE(JSON_EXTRACT(B.fields, '$.isTemplate'), 'false') = 'true',
                 COALESCE(B.fields->'$.templateVer', 0),
                 '{}', B.fields->'$.cardProperties', B.create_at,
                 B.update_at, B.delete_at
          FROM {{.prefix}}blocks_history AS B
          INNER JOIN Channels AS C ON C.Id=B.channel_id
          WHERE B.type='board'
  );
  {{end}}
{{else}}
  {{if .postgres}}
  INSERT INTO {{.prefix}}boards (
      SELECT id, insert_at, '0', channel_id, created_by, modified_by, 'O',
                 COALESCE(B.title, ''),
                 (fields->>'description')::text,
                 B.fields->>'icon',
                 COALESCE((fields->'showDescription')::text::boolean, false),
                 COALESCE((fields->'isTemplate')::text::boolean, false),
                 COALESCE((B.fields->'templateVer')::text::int, 0),
                 '{}', fields->'cardProperties', create_at,
                 update_at, delete_at
          FROM {{.prefix}}blocks AS B
          WHERE type='board'
  );
  INSERT INTO {{.prefix}}boards_history (
      SELECT id, insert_at, '0', channel_id, created_by, modified_by, 'O',
                 COALESCE(B.title, ''),
                 (fields->>'description')::text,
                 B.fields->>'icon',
                 COALESCE((fields->'showDescription')::text::boolean, false),
                 COALESCE((fields->'isTemplate')::text::boolean, false),
                 COALESCE((B.fields->'templateVer')::text::int, 0),
                 '{}', fields->'cardProperties', create_at,
                 update_at, delete_at
          FROM {{.prefix}}blocks_history AS B
          WHERE type='board'
  );
  {{end}}
  {{if .mysql}}
  INSERT INTO {{.prefix}}boards (
      SELECT id, insert_at, '0', channel_id, created_by, modified_by, 'O',
                 COALESCE(B.title, ''),
                 JSON_UNQUOTE(JSON_EXTRACT(fields,'$.description')),
                 JSON_UNQUOTE(JSON_EXTRACT(fields,'$.icon')),
                 COALESCE(B.fields->'$.showDescription', 'false') = 'true',
                 COALESCE(JSON_EXTRACT(B.fields, '$.isTemplate'), 'false') = 'true',
                 COALESCE(B.fields->'$.templateVer', 0),
                 '{}', fields->'$.cardProperties', create_at,
                 update_at, delete_at
          FROM {{.prefix}}blocks AS B
          WHERE type='board'
  );
  INSERT INTO {{.prefix}}boards_history (
      SELECT id, insert_at, '0', channel_id, created_by, modified_by, 'O',
                 COALESCE(B.title, ''),
                 JSON_UNQUOTE(JSON_EXTRACT(fields,'$.description')),
                 JSON_UNQUOTE(JSON_EXTRACT(fields,'$.icon')),
                 COALESCE(B.fields->'$.showDescription', 'false') = 'true',
                 COALESCE(JSON_EXTRACT(B.fields, '$.isTemplate'), 'false') = 'true',
                 COALESCE(B.fields->'$.templateVer', 0),
                 '{}', fields->'$.cardProperties', create_at,
                 update_at, delete_at
          FROM {{.prefix}}blocks_history AS B
          WHERE type='board'
  );
  {{end}}
  {{if .sqlite}}
  INSERT INTO {{.prefix}}boards
      SELECT id, insert_at, '0', channel_id, created_by, modified_by, 'O',
                 COALESCE(title, ''),
                 json_extract(fields, '$.description'),
                 json_extract(fields, '$.icon'), json_extract(fields, '$.showDescription'), json_extract(fields, '$.isTemplate'),
                 COALESCE(json_extract(fields, '$.templateVer'), 0),
                 '{}', json_extract(fields, '$.cardProperties'), create_at,
                 update_at, delete_at
          FROM {{.prefix}}blocks
          WHERE type='board'
  ;
  INSERT INTO {{.prefix}}boards_history
      SELECT id, insert_at, '0', channel_id, created_by, modified_by, 'O',
                 COALESCE(title, ''),
                 json_extract(fields, '$.description'),
                 json_extract(fields, '$.icon'), json_extract(fields, '$.showDescription'), json_extract(fields, '$.isTemplate'),
                 COALESCE(json_extract(fields, '$.templateVer'), 0),
                 '{}', json_extract(fields, '$.cardProperties'), create_at,
                 update_at, delete_at
          FROM {{.prefix}}blocks_history
          WHERE type='board'
  ;
  {{end}}
{{end}}


{{- /* Update block references to boards*/ -}}
{{if .sqlite}}
  UPDATE {{.prefix}}blocks as B
     SET board_id=(SELECT id FROM {{.prefix}}blocks WHERE id=B.parent_id AND type='board')
   WHERE EXISTS (SELECT id FROM {{.prefix}}blocks WHERE id=B.parent_id AND type='board');

  UPDATE {{.prefix}}blocks as B
     SET board_id=(SELECT GP.id FROM {{.prefix}}blocks as GP JOIN {{.prefix}}blocks AS P ON GP.id=P.parent_id WHERE P.id=B.parent_id AND GP.type = 'board')
   WHERE EXISTS (SELECT GP.id FROM {{.prefix}}blocks as GP JOIN {{.prefix}}blocks AS P ON GP.id=P.parent_id WHERE P.id=B.parent_id AND GP.type = 'board');

  UPDATE {{.prefix}}blocks as B
     SET board_id=(SELECT GGP.id FROM {{.prefix}}blocks as GGP JOIN {{.prefix}}blocks as GP ON GGP.id=GP.parent_id JOIN {{.prefix}}blocks as P ON GP.id=P.parent_id WHERE P.id=B.parent_id AND GGP.type = 'board')
   WHERE EXISTS (SELECT GGP.id FROM {{.prefix}}blocks as GGP JOIN {{.prefix}}blocks as GP ON GGP.id=GP.parent_id JOIN {{.prefix}}blocks as P ON GP.id=P.parent_id WHERE P.id=B.parent_id AND GGP.type = 'board');

  UPDATE {{.prefix}}blocks_history as B
     SET board_id=(SELECT id FROM {{.prefix}}blocks_history WHERE id=B.parent_id AND type='board')
   WHERE EXISTS (SELECT id FROM {{.prefix}}blocks_history WHERE id=B.parent_id AND type='board');

  UPDATE {{.prefix}}blocks_history as B
     SET board_id=(SELECT GP.id FROM {{.prefix}}blocks_history as GP JOIN {{.prefix}}blocks_history AS P ON GP.id=P.parent_id WHERE P.id=B.parent_id AND GP.type = 'board')
   WHERE EXISTS (SELECT GP.id FROM {{.prefix}}blocks_history as GP JOIN {{.prefix}}blocks_history AS P ON GP.id=P.parent_id WHERE P.id=B.parent_id AND GP.type = 'board');

  UPDATE {{.prefix}}blocks_history as B
     SET board_id=(SELECT GGP.id FROM {{.prefix}}blocks_history as GGP JOIN {{.prefix}}blocks_history as GP ON GGP.id=GP.parent_id JOIN {{.prefix}}blocks_history as P ON GP.id=P.parent_id WHERE P.id=B.parent_id AND GGP.type = 'board')
   WHERE EXISTS (SELECT GGP.id FROM {{.prefix}}blocks_history as GGP JOIN {{.prefix}}blocks_history as GP ON GGP.id=GP.parent_id JOIN {{.prefix}}blocks_history as P ON GP.id=P.parent_id WHERE P.id=B.parent_id AND GGP.type = 'board');
{{end}}
{{if .mysql}}
    UPDATE {{.prefix}}blocks as B
INNER JOIN {{.prefix}}blocks as P
        ON B.parent_id=P.id
       SET B.board_id=P.id
     WHERE P.type = 'board';

    UPDATE {{.prefix}}blocks as B
INNER JOIN {{.prefix}}blocks as P
        ON B.parent_id=P.id
INNER JOIN {{.prefix}}blocks as GP
        ON P.parent_id=GP.id
       SET B.board_id=GP.id
     WHERE GP.type = 'board';

    UPDATE {{.prefix}}blocks as B
INNER JOIN {{.prefix}}blocks as P
        ON B.parent_id=P.id
INNER JOIN {{.prefix}}blocks as GP
        ON P.parent_id=GP.id
INNER JOIN {{.prefix}}blocks as GPP
        ON GP.parent_id=GPP.id
       SET B.board_id=GPP.id
     WHERE GPP.type = 'board';

    UPDATE {{.prefix}}blocks_history as B
INNER JOIN {{.prefix}}blocks_history as P
        ON B.parent_id=P.id
       SET B.board_id=P.id
     WHERE P.type = 'board';

    UPDATE {{.prefix}}blocks_history as B
INNER JOIN {{.prefix}}blocks_history as P
        ON B.parent_id=P.id
INNER JOIN {{.prefix}}blocks_history as GP
        ON P.parent_id=GP.id
       SET B.board_id=GP.id
     WHERE GP.type = 'board';

    UPDATE {{.prefix}}blocks_history as B
INNER JOIN {{.prefix}}blocks_history as P
        ON B.parent_id=P.id
INNER JOIN {{.prefix}}blocks_history as GP
        ON P.parent_id=GP.id
INNER JOIN {{.prefix}}blocks_history as GPP
        ON GP.parent_id=GPP.id
       SET B.board_id=GPP.id
     WHERE GPP.type = 'board';
{{end}}
{{if .postgres}}
  UPDATE {{.prefix}}blocks as B
     SET board_id=P.id
    FROM {{.prefix}}blocks as P
   WHERE B.parent_id=P.id
     AND P.type = 'board';

  UPDATE {{.prefix}}blocks as B
     SET board_id=GP.id
    FROM {{.prefix}}blocks as P,
         {{.prefix}}blocks as GP
   WHERE B.parent_id=P.id
     AND P.parent_id=GP.id
     AND GP.type = 'board';

  UPDATE {{.prefix}}blocks as B
     SET board_id=GGP.id
    FROM {{.prefix}}blocks as P,
         {{.prefix}}blocks as GP,
         {{.prefix}}blocks as GGP
   WHERE B.parent_id=P.id
     AND P.parent_id=GP.id
     AND GP.parent_id=GGP.id
     AND GGP.type = 'board';

  UPDATE {{.prefix}}blocks_history as B
     SET board_id=P.id
    FROM {{.prefix}}blocks_history as P
   WHERE B.parent_id=P.id
     AND P.type = 'board';

  UPDATE {{.prefix}}blocks_history as B
     SET board_id=GP.id
    FROM {{.prefix}}blocks_history as P,
         {{.prefix}}blocks_history as GP
   WHERE B.parent_id=P.id
     AND P.parent_id=GP.id
     AND GP.type = 'board';

  UPDATE {{.prefix}}blocks_history as B
     SET board_id=GGP.id
    FROM {{.prefix}}blocks_history as P,
         {{.prefix}}blocks_history as GP,
         {{.prefix}}blocks_history as GGP
   WHERE B.parent_id=P.id
     AND P.parent_id=GP.id
     AND GP.parent_id=GGP.id
     AND GGP.type = 'board';
{{end}}


{{- /* Remove boards, including templates */ -}}
DELETE FROM {{.prefix}}blocks WHERE type = 'board';
DELETE FROM {{.prefix}}blocks_history WHERE type = 'board';

{{- /* add board_members */ -}}
CREATE TABLE {{.prefix}}board_members (
    board_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    roles VARCHAR(64),
    scheme_admin BOOLEAN,
    scheme_editor BOOLEAN,
    scheme_commenter BOOLEAN,
    scheme_viewer BOOLEAN,
    PRIMARY KEY (board_id, user_id)
) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

CREATE INDEX idx_boardmembers_user_id ON {{.prefix}}board_members(user_id);

{{- /* if we're in plugin, migrate channel memberships to the board */ -}}
{{if .plugin}}
INSERT INTO {{.prefix}}board_members (
    SELECT B.Id, CM.UserId, CM.Roles, (CM.UserId=B.created_by) OR CM.SchemeAdmin, CM.SchemeUser, FALSE, CM.SchemeGuest
    FROM {{.prefix}}boards AS B
    INNER JOIN ChannelMembers as CM ON CM.ChannelId=B.channel_id
);
{{end}}

{{- /* if we're in personal server or desktop, create memberships for everyone */ -}}
{{if and (not .plugin) (not .singleUser)}}
{{- /* for personal server, create a membership per user and board */ -}}
INSERT INTO {{.prefix}}board_members
     SELECT B.id, U.id, '', B.created_by=U.id, TRUE, FALSE, FALSE
       FROM {{.prefix}}boards AS B, {{.prefix}}users AS U;
{{end}}

{{if and (not .plugin) .singleUser}}
{{- /* for personal desktop, as we don't have users, create a membership */ -}}
{{- /* per board with a fixed user id */ -}}
INSERT INTO {{.prefix}}board_members
     SELECT B.id, 'single-user', '', TRUE, TRUE, FALSE, FALSE
       FROM {{.prefix}}boards AS B;
{{end}}
