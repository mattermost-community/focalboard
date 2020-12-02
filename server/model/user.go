package model

type User struct {
	ID          string                 `json:"id"`
	Username    string                 `json:"username"`
	Email       string                 `json:"email"`
	Password    string                 `json:"-"`
	MfaSecret   string                 `json:"-"`
	AuthService string                 `json:"-"`
	AuthData    string                 `json:"-"`
	Props       map[string]interface{} `json:"props"`
	CreateAt    int64                  `json:"create_at,omitempty"`
	UpdateAt    int64                  `json:"update_at,omitempty"`
	DeleteAt    int64                  `json:"delete_at"`
}

type Session struct {
	ID     string                 `json:"id"`
	Token  string                 `json:"token"`
	UserID string                 `json:"user_id"`
	Props  map[string]interface{} `json:"props"`
}
