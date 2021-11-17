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
{{end}}
