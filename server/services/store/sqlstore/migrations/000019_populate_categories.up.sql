CREATE TABLE IF NOT EXISTS {{.prefix}}categories (
    id varchar(36) NOT NULL,
    name varchar(100) NOT NULL,
    user_id varchar(36) NOT NULL,
    team_id varchar(36) NOT NULL,
    channel_id varchar(36),
    create_at BIGINT,
    update_at BIGINT,
    delete_at BIGINT,
    PRIMARY KEY (id)
    ) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

CREATE INDEX idx_categories_user_id_team_id ON {{.prefix}}categories(user_id, team_id);
