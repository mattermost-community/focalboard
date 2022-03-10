// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {useAppSelector} from '../../store/hooks'
import {getMyBoardMembership, getCurrentBoard} from '../../store/boards'
import {getCurrentTeam} from '../../store/teams'

import {Utils} from '../../utils'

type Props = {
    boardId?: string
    teamId?: string
    permissions: string[]
    invert?: boolean
    children: React.ReactElement
}

const BoardPermissionGate = React.memo((props: Props): React.ReactElement|null => {
    const currentTeam = useAppSelector(getCurrentTeam)
    const currentBoard = useAppSelector(getCurrentBoard)

    const boardId = props.boardId || currentBoard.id
    const teamId = props.teamId || currentTeam?.id || ''

    const member = useAppSelector(getMyBoardMembership(boardId))

    if (!member) {
        return null
    }
    if (!Utils.isFocalboardPlugin()) {
        return props.children
    }

    if (!boardId || !teamId) {
        return null
    }

    for (const permission of props.permissions) {
        if (['manage_board_type', 'delete_board', 'share_board', 'manage_board_roles'].includes(permission) && member.schemeAdmin) {
            if (props.invert) {
                return null
            }
            return props.children
        }
        if (['manage_board_cards', 'manage_board_properties'].includes(permission) && (member.schemeAdmin || member.schemeEditor)) {
            if (props.invert) {
                return null
            }
            return props.children
        }
        if (['view_board'].includes(permission) && (member.schemeAdmin || member.schemeEditor || member.schemeCommenter || member.schemeViewer)) {
            if (props.invert) {
                return null
            }
            return props.children
        }
    }
    if (props.invert) {
        return props.children
    }
    return null
})

export default BoardPermissionGate
