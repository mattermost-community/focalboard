{{ if or .postgres .mysql }}
    {{ dropColumnIfNeeded "category_boards" "delete_at" }}
{{end}}

{{if .sqlite}}
    ALTER TABLE {{.prefix}}category_boards RENAME TO {{.prefix}}category_boards_old;
    CREATE TABLE {{.prefix}}category_boards (
        id varchar(36) NOT NULL,
        user_id varchar(36) NOT NULL,
        category_id varchar(36) NOT NULL,
        board_id VARCHAR(36) NOT NULL,
        create_at BIGINT,
        update_at BIGINT,
        sort_order BIGINT,
        PRIMARY KEY (id)
    );

    INSERT INTO {{.prefix}}category_boards SELECT id, user_id, category_id, board_id, create_at, update_at, sort_order from {{.prefix}}category_boards_old;
    DROP TABLE {{.prefix}}category_boards_old;
{{end}}