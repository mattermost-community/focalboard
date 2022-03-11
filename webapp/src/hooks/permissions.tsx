// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useAppSelector} from '../store/hooks'
import {getMyBoardMembership, getCurrentBoard} from '../store/boards'
import {getCurrentTeam} from '../store/teams'
import {Utils} from '../utils'

export const useHasPermissions = (teamId: string, boardId: string, permissions: string[]): boolean => {
    if (!boardId || !teamId) {
        return false
    }

    const member = useAppSelector(getMyBoardMembership(boardId))

    if (!member) {
        return false
    }

    if (!Utils.isFocalboardPlugin()) {
        return true
    }

    for (const permission of permissions) {
        if (['manage_board_type', 'delete_board', 'share_board', 'manage_board_roles'].includes(permission) && member.schemeAdmin) {
            return true
        }
        if (['manage_board_cards', 'manage_board_properties'].includes(permission) && (member.schemeAdmin || member.schemeEditor)) {
            return true
        }
        if (['view_board'].includes(permission) && (member.schemeAdmin || member.schemeEditor || member.schemeCommenter || member.schemeViewer)) {
            return true
        }
    }
    return false
}

export const useHasCurrentTeamPermissions = (boardId: string, permissions: string[]): boolean => {
    const currentTeam = useAppSelector(getCurrentTeam)
    return useHasPermissions(currentTeam?.id || '', boardId, permissions)
}

export const useHasCurrentBoardPermissions = (permissions: string[]): boolean => {
    const currentBoard = useAppSelector(getCurrentBoard)

    return useHasCurrentTeamPermissions(currentBoard?.id || '', permissions)
}
