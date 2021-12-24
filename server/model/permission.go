package model

import (
	mmModel "github.com/mattermost/mattermost-server/v6/model"
)

var (
	PermissionViewTeam              = mmModel.PermissionViewTeam
	PermissionViewMembers           = mmModel.PermissionViewMembers
	PermissionCreatePublicChannel   = mmModel.PermissionCreatePublicChannel
	PermissionCreatePrivateChannel  = mmModel.PermissionCreatePrivateChannel
	PermissionManageBoardType       = &mmModel.Permission{"manage_board_type", "", "", ""}
	PermissionDeleteBoard           = &mmModel.Permission{"delete_board", "", "", ""}
	PermissionViewBoard             = &mmModel.Permission{"view_board", "", "", ""}
	PermissionManageBoardRoles      = &mmModel.Permission{"manage_board_roles", "", "", ""}
	PermissionShareBoard            = &mmModel.Permission{"share_board", "", "", ""}
	PermissionManageBoardCards      = &mmModel.Permission{"manage_board_cards", "", "", ""}
	PermissionManageBoardProperties = &mmModel.Permission{"manage_board_properties", "", "", ""}
)
