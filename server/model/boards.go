package model

type BoardType string

const (
	BoardTypeOpen    BoardType = "O"
	BoardTypePrivate BoardType = "P"
)

type Board struct {
	Id        string    `json:"id"`
	TeamId    string    `json:"team_id"`
	ChannelId string    `json:"channel_id"`
	CreatorId string    `json:"creator_id"`
	Type      BoardType `json:"type"`

	Title           string `json:"title"`
	Description     string `json:"description"`
	Icon            string `json:"icon"`
	ShowDescription bool   `json:"show_description"`
	IsTemplate      bool   `json:"is_template"`

	SchemeId           *string                `json:"scheme_id"`
	Properties         map[string]interface{} `json:"properties" db:"-"`
	CardProperties     map[string]interface{} `json:"card_properties" db:"-"`
	ColumnCalculations map[string]interface{} `json:"column_calculations" db:"-"`

	MsgCount int64 `json:"msg_count_root"`

	CreateAt int64 `json:"create_at"`
	UpdateAt int64 `json:"update_at"`
	DeleteAt int64 `json:"delete_at"`
}
