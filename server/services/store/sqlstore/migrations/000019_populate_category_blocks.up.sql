CREATE TABLE {{.prefix}}category_boards (
    id varchar(36) NOT NULL,
    user_id varchar(36) NOT NULL,
    category_id varchar(36) NOT NULL,
    board_id VARCHAR(36) NOT NULL,
    create_at BIGINT,
    update_at BIGINT,
    delete_at BIGINT,
    PRIMARY KEY (id)
    ) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

CREATE INDEX idx_categoryboards_category_id ON {{.prefix}}category_boards(category_id);

{{if .plugin}}
    INSERT INTO {{.prefix}}category_boards(id, user_id, category_id, board_id, create_at, update_at, delete_at)
    SELECT
        {{ if .postgres }}
            REPLACE(uuid_in(md5(random()::text || clock_timestamp()::text)::cstring)::varchar, '-', ''),
        {{ end }}
        {{ if .mysql }}
            UUID(),
        {{ end }}
        {{.prefix}}categories.user_id,
        {{.prefix}}categories.id,
        {{.prefix}}boards.id,
        {{if .postgres}}(extract(epoch from now())*1000)::bigint,{{end}}
        {{if .mysql}}UNIX_TIMESTAMP() * 1000,{{end}}
        0,
        0
    FROM
        {{.prefix}}categories
        JOIN {{.prefix}}boards ON {{.prefix}}categories.channel_id = {{.prefix}}boards.channel_id
        AND {{.prefix}}boards.is_template = false;
{{end}}
