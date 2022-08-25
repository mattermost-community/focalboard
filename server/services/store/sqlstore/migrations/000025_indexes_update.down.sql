DROP INDEX idx_subscriptions_subscriber_id ON {{.prefix}}subscriptions;
DROP INDEX idx_blocks_board_id_parent_id ON {{.prefix}}blocks;

{{if .mysql}}
ALTER TABLE {{.prefix}}blocks DROP PRIMARY KEY;
ALTER TABLE {{.prefix}}blocks ADD PRIMARY KEY (channel_id, id);
{{end}}

{{if .postgres}}
ALTER TABLE {{.prefix}}blocks DROP CONSTRAINT {{.prefix}}blocks_pkey1;
ALTER TABLE {{.prefix}}blocks ADD PRIMARY KEY (channel_id, id);
{{end}}

{{if .sqlite}}
ALTER TABLE {{.prefix}}blocks RENAME TO {{.prefix}}blocks_tmp;

CREATE TABLE {{.prefix}}blocks (
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
        PRIMARY KEY (channel_id, id)
);

INSERT INTO {{.prefix}}blocks SELECT * FROM {{.prefix}}blocks_tmp;

DROP TABLE {{.prefix}}blocks_tmp;
{{end}}
