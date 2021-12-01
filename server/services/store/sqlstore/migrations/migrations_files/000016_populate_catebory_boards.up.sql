CREATE TABLE {{.prefix}}category_boards (
    {{if .mysql}}id INT AUTO_INCREMENT,{{end}}
    {{if .postgres}}id SERIAL,{{end}}
    {{if .sqlite}}varchar(36),{{end}}
    category_id varchar(36) NOT NULL,
    board_id VARCHAR(36) NOT NULL,
    {{if .postgres}}create_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),{{end}}
    {{if .sqlite}}create_at DATETIME NOT NULL DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),{{end}}
    {{if .mysql}}create_at DATETIME(6) NOT NULL DEFAULT NOW(6),{{end}}
    update_at BIGINT,
    delete_at BIGINT,
    PRIMARY KEY (id)
    ) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

{{if .plugin}}
    INSERT INTO {{.prefix}}category_boards(category_id, board_id)
    SELECT
        {{.prefix}}categories.id,
        {{.prefix}}blocks.id
    FROM
        {{.prefix}}categories
        JOIN {{.prefix}}blocks
    ON {{.prefix}}categories.channel_id = {{.prefix}}blocks.workspace_id
        AND {{.prefix}}blocks.type = 'board';

    ALTER TABLE {{.prefix}}categories DROP COLUMN channel_id;

    {{if .mysql}}
        ALTER TABLE {{.prefix}}category_boards MODIFY id varchar(36);
    {{end}}

    {{if .postgres}}
        ALTER TABLE {{.prefix}}category_boards ALTER COLUMN id TYPE varchar(36);
        ALTER TABLE {{.prefix}}category_boards ALTER COLUMN id DROP DEFAULT;
    {{end}}
{{end}}
