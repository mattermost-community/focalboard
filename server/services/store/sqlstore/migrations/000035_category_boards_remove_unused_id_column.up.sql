{{if or .postgres .mysql}}
    {{ dropColumnIfNeeded "category_boards" "id" }}
{{end}}

{{if .sqlite}}
    ALTER TABLE {{.prefix}}category_boards RENAME TO {{.prefix}}category_boards_old;
    CREATE TABLE {{.prefix}}category_boards (
        user_id varchar(36) NOT NULL,
        category_id varchar(36) NOT NULL,
        board_id VARCHAR(36) NOT NULL,
        create_at BIGINT,
        update_at BIGINT,
        sort_order BIGINT
    );

    INSERT INTO {{.prefix}}category_boards SELECT user_id, category_id, board_id, create_at, update_at, sort_order from {{.prefix}}category_boards_old;
    DROP TABLE {{.prefix}}category_boards_old;
{{end}}