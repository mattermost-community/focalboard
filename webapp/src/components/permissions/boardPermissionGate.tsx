// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {useAppSelector} from '../../store/hooks'
import {getCurrentBoard} from '../../store/boards'
import {getCurrentTeam} from '../../store/teams'
import {useHasPermissions} from '../../hooks/permissions'

type Props = {
    boardId?: string
    teamId?: string
    permissions: string[]
    invert?: boolean
    children: React.ReactNode
}

const BoardPermissionGate = React.memo((props: Props): React.ReactElement|null => {
    const currentTeam = useAppSelector(getCurrentTeam)
    const currentBoard = useAppSelector(getCurrentBoard)

    const boardId = props.boardId || currentBoard?.id || ''
    const teamId = props.teamId || currentTeam?.id || ''

    const allowed = useHasPermissions(teamId, boardId, props.permissions)

    if (allowed) {
        if (props.invert) {
            return null
        }
        return (<>{props.children}</>)
    }
    return null
})

export default BoardPermissionGate
