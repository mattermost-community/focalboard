CREATE TABLE IF NOT EXISTS {{.prefix}}board_members (
    board_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    roles VARCHAR(64),
    scheme_admin BOOLEAN,
    scheme_editor BOOLEAN,
    scheme_commenter BOOLEAN,
    scheme_viewer BOOLEAN,
    PRIMARY KEY (board_id, user_id)
) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

CREATE INDEX idx_boardmembers_user_id ON {{.prefix}}board_members(user_id);