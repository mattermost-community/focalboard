CREATE TABLE {{.prefix}}preferences
(
    userid   VARCHAR(36) NOT NULL,
    category VARCHAR(32) NOT NULL,
    name     VARCHAR(32) NOT NULL,
    value    TEXT        NULL,
    PRIMARY KEY (userid, category, name)
) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

CREATE index idx_{{.prefix}}preferences_category
    ON {{.prefix}}preferences (category);

CREATE index idx_{{.prefix}}preferences_name
    ON {{.prefix}}preferences (name);
