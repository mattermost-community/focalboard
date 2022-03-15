// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {useAppSelector} from '../../store/hooks'
import {getCurrentBoard} from '../../store/boards'
import {getCurrentTeam} from '../../store/teams'
import {Permission} from '../../constants'
import {useHasPermissions} from '../../hooks/permissions'

type Props = {
    boardId?: string
    teamId?: string
    permissions: Permission[]
    invert?: boolean
    children: React.ReactNode
}

const BoardPermissionGate = React.memo((props: Props): React.ReactElement|null => {
    const currentTeam = useAppSelector(getCurrentTeam)
    const currentBoard = useAppSelector(getCurrentBoard)

    const boardId = props.boardId || currentBoard?.id || ''
    const teamId = props.teamId || currentTeam?.id || ''

    let allowed = useHasPermissions(teamId, boardId, props.permissions)

    if (props.invert) {
        allowed = !allowed
    }

    if (allowed) {
        return (<>{props.children}</>)
    }
    return null
})

export default BoardPermissionGate
