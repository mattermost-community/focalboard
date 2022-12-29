{{if or .mysql .postgres}}
    {{ addConstraintIfNeeded "category_boards" "unique_user_category_board" "UNIQUE" "UNIQUE(user_id, board_id)"}}
{{end}}

{{if .sqlite}}
    CREATE UNIQUE INDEX IF NOT EXISTS unique_user_category_board ON {{.prefix}}category_boards(user_id, board_id);
{{end}}