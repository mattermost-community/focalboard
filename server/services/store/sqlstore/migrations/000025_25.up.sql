CREATE TABLE IF NOT EXISTS {{.prefix}}boards (
    id VARCHAR(36) NOT NULL PRIMARY KEY,

    {{if .postgres}}insert_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),{{end}}
	{{if .sqlite}}insert_at DATETIME NOT NULL DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),{{end}}
	{{if .mysql}}insert_at DATETIME(6) NOT NULL DEFAULT NOW(6),{{end}}

    team_id VARCHAR(36) NOT NULL,
    channel_id VARCHAR(36),
    created_by VARCHAR(36),
    modified_by VARCHAR(36),
    type VARCHAR(1) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon VARCHAR(256),
    show_description BOOLEAN,
    is_template BOOLEAN,
    template_version INT DEFAULT 0,
    {{if .mysql}}
    properties JSON,
    card_properties JSON,
    {{end}}
    {{if .postgres}}
    properties JSONB,
    card_properties JSONB,
    {{end}}
    {{if .sqlite}}
    properties TEXT,
    card_properties TEXT,
    {{end}}
    create_at BIGINT,
    update_at BIGINT,
    delete_at BIGINT
) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};

CREATE INDEX idx_board_team_id ON {{.prefix}}boards(team_id, is_template);
CREATE INDEX idx_board_channel_id ON {{.prefix}}boards(channel_id);