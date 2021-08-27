package model

type BoardMember struct {
	BoardID       string                 `json:"board_id"`
	UserID        string                 `json:"user_id"`
	Roles         string                 `json:"roles"`
	SchemeGuest   bool                   `json:"scheme_guest"`
	SchemeUser    bool                   `json:"scheme_user"`
	SchemeAdmin   bool                   `json:"scheme_admin"`
	LastViewedAt  int64                  `json:"last_viewed_at"`
	MentionCount  int64                  `json:"mention_count"`
	NotifyProps   map[string]interface{} `json:"notify_props"`
	ExplicitRoles string                 `json:"explicit_roles"`
}
