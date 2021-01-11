CREATE TABLE IF NOT EXISTS users (
	id VARCHAR(100),
	username VARCHAR(100),
	email VARCHAR(255),
	password VARCHAR(100),
	mfa_secret VARCHAR(100),
	auth_service VARCHAR(20),
	auth_data VARCHAR(255),
	props       JSON,
	create_at    BIGINT,
	update_at    BIGINT,
	delete_at    BIGINT,
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sessions (
	id VARCHAR(100),
	token VARCHAR(100),
	user_id VARCHAR(100),
	props       JSON,
	create_at    BIGINT,
	update_at    BIGINT,
	PRIMARY KEY (id)
);
