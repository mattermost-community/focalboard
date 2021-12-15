package model

type BoardType string

const (
	BoardTypeOpen    BoardType = "O"
	BoardTypePrivate BoardType = "P"
)

// Board groups a set of blocks and its layout
// swagger:model
type Board struct {
	// The ID for the board
	// required: true
	ID string `json:"id"`

	// The ID of the team that the board belongs to
	// required: false
	TeamID string `json:"team_id"`

	// The ID of the channel that the board was created from
	// required: false
	ChannelID string `json:"channel_id"`

	// The ID of the user that created the board
	// required: true
	CreatedBy string `json:"created_by"`

	// The ID of the last user that updated the board
	// required: true
	ModifiedBy string `json:"modified_by"`

	// The type of the board
	// required: true
	Type BoardType `json:"type"`

	// The title of the board
	// required: false
	Title string `json:"title"`

	// The description of the board
	// required: false
	Description string `json:"description"`

	// The icon of the board
	// required: false
	Icon string `json:"icon"`

	// Indicates if the board shows the description on the interface
	// required: false
	ShowDescription bool `json:"show_description"`

	// Marks the template boards
	// required: false
	IsTemplate bool `json:"is_template"`

	// The properties of the board
	// required: false
	Properties map[string]interface{} `json:"properties" db:"-"`

	// The properties of the board cards
	// required: false
	CardProperties map[string]interface{} `json:"card_properties" db:"-"`

	// The calculations on the board's cards
	// required: false
	ColumnCalculations map[string]interface{} `json:"column_calculations" db:"-"`

	// The creation time
	// required: true
	CreateAt int64 `json:"create_at"`

	// The last modified time
	// required: true
	UpdateAt int64 `json:"update_at"`

	// The deleted time. Set to indicate this block is deleted
	// required: false
	DeleteAt int64 `json:"delete_at"`
}

// BoardMember stores the information of the membership of a user on a board
// swagger:model
type BoardMember struct {
	// The ID of the board
	// required: true
	BoardID string `json:"board_id"`

	// The ID of the user
	// required: true
	UserID string `json:"user_id"`

	// The independent roles of the user on the board
	// required: false
	Roles string `json:"roles"`

	// Marks the user as an admin of the board
	// required: true
	SchemeAdmin bool `json:"scheme_admin"`

	// Marks the user as an editor of the board
	// required: true
	SchemeEditor bool `json:"scheme_editor"`

	// Marks the user as an commenter of the board
	// required: true
	SchemeCommenter bool `json:"scheme_commenter"`

	// Marks the user as an viewer of the board
	// required: true
	SchemeViewer bool `json:"scheme_viewer"`
}

type InvalidBoardErr struct {
	msg string
}

func (ibe InvalidBoardErr) Error() string {
	return ibe.msg
}

func (b *Board) IsValid() error {
	if b.TeamID == "" {
		return InvalidBoardErr{"empty-team-id"}
	}

	// ToDo: maybe we'll need to remove this for single user mode
	if b.CreatedBy == "" && b.ModifiedBy == "" {
		return InvalidBoardErr{"empty-created-and-modified-by"}
	}
	if b.Type != BoardTypeOpen && b.Type != BoardTypePrivate {
		return InvalidBoardErr{"invalid-board-type"}
	}
	return nil
}
