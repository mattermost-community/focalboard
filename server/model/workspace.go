package model

type Workspace struct {
	ID          string                 `json:"id"`
	SignupToken string                 `json:"signupToken"`
	Settings    map[string]interface{} `json:"settings"`
	ModifiedBy  string                 `json:"modifiedBy"`
	UpdateAt    int64                  `json:"updateAt"`
}
