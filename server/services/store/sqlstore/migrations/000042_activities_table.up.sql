CREATE TABLE IF NOT EXISTS {{.prefix}}activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    board_id INT NOT NULL,
    card_id INT NULL,
    text VARCHAR(255),
    type VARCHAR(255),
    created_by VARCHAR(255) NOT NULL,
    created_for_id VARCHAR(255) NULL,
    created_for_type VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES {{.prefix}}boards(id)
) {{if .mysql}}DEFAULT CHARACTER SET utf8mb4{{end}};
