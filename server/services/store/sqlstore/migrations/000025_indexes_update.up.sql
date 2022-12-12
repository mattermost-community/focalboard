{{- /* delete old blocks PK and add id as the new one */ -}}
{{if .mysql}}
ALTER TABLE {{.prefix}}blocks DROP PRIMARY KEY;
ALTER TABLE {{.prefix}}blocks ADD PRIMARY KEY (id);
{{end}}

{{if .postgres}}
ALTER TABLE {{.prefix}}blocks DROP CONSTRAINT {{.prefix}}blocks_pkey1;
ALTER TABLE {{.prefix}}blocks ADD PRIMARY KEY (id);
{{end}}

{{- /* there is no way for SQLite to update the PK or add a unique constraint */ -}}
{{if .sqlite}}
ALTER TABLE {{.prefix}}blocks RENAME TO {{.prefix}}blocks_tmp;

CREATE TABLE IF NOT EXISTS {{.prefix}}blocks (
        id VARCHAR(36),
        insert_at DATETIME NOT NULL DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
        parent_id VARCHAR(36),
        schema BIGINT,
        type TEXT,
        title TEXT,
        fields TEXT,
        create_at BIGINT,
        update_at BIGINT,
        delete_at BIGINT,
        root_id VARCHAR(36),
        modified_by VARCHAR(36),
        channel_id VARCHAR(36),
        created_by VARCHAR(36),
        board_id VARCHAR(36),
        PRIMARY KEY (id)
);

INSERT INTO {{.prefix}}blocks SELECT * FROM {{.prefix}}blocks_tmp;

DROP TABLE {{.prefix}}blocks_tmp;
{{end}}

{{- /* most block searches use board_id or a combination of board and parent ids */ -}}
{{ createIndexIfNeeded "blocks" "board_id, parent_id" }}

{{- /* get subscriptions is used once per board page load */ -}}
{{ createIndexIfNeeded "subscriptions" "subscriber_id" }}