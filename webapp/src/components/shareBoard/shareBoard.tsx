// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {useAppSelector} from '../../store/hooks'
import {IUser} from '../../user'
import {getWorkspaceUsersList} from '../../store/users'
import {getClientConfig} from '../../store/clientConfig'

import './shareBoard.scss'
import RootPortal from '../rootPortal'
import Dialog from '../dialog'

type Props = {
    onClose: () => void
}

const ShareBoardDialog = (props: Props): JSX.Element => {
    // list of all users
    const workspaceUsers = useAppSelector<IUser[]>(getWorkspaceUsersList)

    // the "Share internally" link.
    const internalShareLink = window.location.href

    const clientConfig = useAppSelector(getClientConfig)

    // show external, "Publish" link only if this variable is true"
    const externalSharingEnabled = clientConfig.enablePublicSharedBoards

    // TODO update this later to use actual token
    const readToken = 'hardcoded-token'
    const shareUrl = new URL(window.location.toString())
    shareUrl.searchParams.set('r', readToken)

    return (
        <RootPortal>
            <Dialog onClose={props.onClose}>
                <span>{'TODO: render your component here'}</span>
            </Dialog>
        </RootPortal>
    )
}

export default ShareBoardDialog
