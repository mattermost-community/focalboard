{{if or .mysql .postgres}}
{{ addConstraintIfNeeded "category_boards" "unique_user_category_board" "UNIQUE" "UNIQUE(user_id, board_id)"}}
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
        hidden boolean,
        PRIMARY KEY (id),
        CONSTRAINT unique_user_category_board UNIQUE (user_id, board_id)
    );

    INSERT INTO {{.prefix}}category_boards
        (id, user_id, category_id, board_id, create_at, update_at, sort_order, hidden)
        SELECT id, user_id, category_id, board_id, create_at, update_at, sort_order, hidden FROM {{.prefix}}category_boards_old;
    DROP TABLE {{.prefix}}category_boards_old;

{{end}}
