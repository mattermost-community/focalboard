// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useAppSelector} from '../store/hooks'
import {getMyBoardMembership, getCurrentBoardId} from '../store/boards'
import {getCurrentTeam} from '../store/teams'
import {Utils} from '../utils'
import {Permission} from '../constants'

export const useHasPermissions = (teamId: string, boardId: string, permissions: Permission[]): boolean => {
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

    const adminPermissions = [Permission.ManageBoardType, Permission.DeleteBoard, Permission.ShareBoard, Permission.ManageBoardRoles]
    const editorPermissions = [Permission.ManageBoardCards, Permission.ManageBoardProperties]
    const viewerPermissions = [Permission.ViewBoard]

    for (const permission of permissions) {
        if (adminPermissions.includes(permission) && member.schemeAdmin) {
            return true
        }
        if (editorPermissions.includes(permission) && (member.schemeAdmin || member.schemeEditor)) {
            return true
        }
        if (viewerPermissions.includes(permission) && (member.schemeAdmin || member.schemeEditor || member.schemeCommenter || member.schemeViewer)) {
            return true
        }
    }
    return false
}

export const useHasCurrentTeamPermissions = (boardId: string, permissions: Permission[]): boolean => {
    const currentTeam = useAppSelector(getCurrentTeam)
    return useHasPermissions(currentTeam?.id || '', boardId, permissions)
}

export const useHasCurrentBoardPermissions = (permissions: Permission[]): boolean => {
    const currentBoardId = useAppSelector(getCurrentBoardId)

    return useHasCurrentTeamPermissions(currentBoardId || '', permissions)
}
