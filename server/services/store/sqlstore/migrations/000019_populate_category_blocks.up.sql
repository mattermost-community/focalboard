CREATE TABLE {{.prefix}}category_blocks (
    {{if .mysql}}id INT AUTO_INCREMENT,{{end}}
    {{if .postgres}}id SERIAL,{{end}}
    {{if .sqlite}}id varchar(36),{{end}}
    user_id varchar(32) NOT NULL,
    category_id varchar(36) NOT NULL,
    block_id VARCHAR(36) NOT NULL,
    create_at BIGINT,
    update_at BIGINT,
    delete_at BIGINT,
    PRIMARY KEY (id)
    ) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

{{if .plugin}}
    INSERT INTO {{.prefix}}category_blocks(user_id, category_id, block_id, create_at, update_at, delete_at)
    SELECT
        {{.prefix}}categories.user_id,
        {{.prefix}}categories.id,
        {{.prefix}}boards.id,
        {{if .postgres}}(extract(epoch from now())*1000)::bigint,{{end}}
        {{if .mysql}}UNIX_TIMESTAMP() * 1000,{{end}}
        {{if .sqlite}}CAST(strftime('%s', 'now') * 1000 as bigint),{{end}}
        0,
        0
    FROM
        {{.prefix}}categories
        JOIN {{.prefix}}boards ON {{.prefix}}categories.channel_id = {{.prefix}}boards.channel_id
        AND {{.prefix}}boards.is_template = false
;

    ALTER TABLE {{.prefix}}categories DROP COLUMN channel_id;

    {{if .mysql}}
        ALTER TABLE {{.prefix}}category_blocks MODIFY id varchar(36);
    {{end}}

    {{if .postgres}}
        ALTER TABLE {{.prefix}}category_blocks ALTER COLUMN id TYPE varchar(36);
        ALTER TABLE {{.prefix}}category_blocks ALTER COLUMN id DROP DEFAULT;
    {{end}}
{{end}}
