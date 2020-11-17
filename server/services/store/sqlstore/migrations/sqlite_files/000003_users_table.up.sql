CREATE TABLE IF NOT EXISTS users (
	id VARCHAR(100),
	username VARCHAR(100),
	email VARCHAR(255),
	password VARCHAR(100),
    mfa_secret VARCHAR(100),
    auth_service VARCHAR(20),
    auth_data VARCHAR(255),
	Props       TEXT,
	CreateAt    BIGINT,
	UpdateAt    BIGINT,
	DeleteAt    BIGINT,
	PRIMARY KEY (id)
);
