CREATE TABLE {{.prefix}}sidebar_categories (
    {{if .mysql}}id INT NOT NULL AUTO_INCREMENT,{{end}}
    {{if .postgres}}id SERIAL,{{end}}
    name varchar(100) NOT NULL,
    user_id varchar(32) NOT NULL,
    team_id varchar(32) NOT NULL,
    channel_id varchar(32) NOT NULL
) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

CREATE TABLE {{.prefix}}category_boards (
    {{if .mysql}}id INT NOT NULL AUTO_INCREMENT,{{end}}
    {{if .postgres}}id SERIAL,{{end}}
    category_id int NOT NULL,
    board_id int NOT NULL
) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};
