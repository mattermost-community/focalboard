CREATE TABLE {{.prefix}}board_members_history (
    {{if .postgres}}id SERIAL PRIMARY KEY,{{end}}
	{{if .sqlite}}id INTEGER PRIMARY KEY AUTOINCREMENT,{{end}}
	{{if .mysql}}id INT PRIMARY KEY AUTO_INCREMENT,{{end}}
    board_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    action VARCHAR(10),
	insert_at BIGINT NOT NULL
) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

CREATE INDEX idx_boardmembershistory_user_id ON {{.prefix}}board_members_history(user_id);
CREATE INDEX idx_boardmembershistory_board_id_userid ON {{.prefix}}board_members_history(board_id, user_id);

INSERT INTO {{.prefix}}board_members_history (board_id, user_id, action, insert_at) SELECT board_id, user_id, 'created',
    {{if .postgres}}CAST(extract(epoch from now()) * 1000 AS BIGINT){{end}}
    {{if .sqlite}}strftime('%s')*1000{{end}}
    {{if .mysql}}UNIX_TIMESTAMP(now())*1000{{end}}
    from {{.prefix}}board_members;
