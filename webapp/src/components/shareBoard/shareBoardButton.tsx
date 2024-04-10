// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react'
import {FormattedMessage} from 'react-intl'

import Button from '../../widgets/buttons/button'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import {useAppSelector} from '../../store/hooks'
import {getCurrentBoard, getCurrentBoardMembers} from '../../store/boards'
import Globe from '../../widgets/icons/globe'
import LockOutline from '../../widgets/icons/lockOutline'
import {BoardTypeOpen} from '../../blocks/board'
import Avatar from '../../widgets/icons/adminAvatar'
import { useSelector } from 'react-redux';

import './shareBoardButton.scss'

import ShareBoardDialog from './shareBoard'
import { ChevronDownIcon } from '@mattermost/compass-icons/components'

type Props = {
    enableSharedBoards: boolean
}
const ShareBoardButton = (props: Props) => {
    const [showShareDialog, setShowShareDialog] = useState(false)
    const board = useAppSelector(getCurrentBoard)
    const members = useSelector(getCurrentBoardMembers);

    const iconForBoardType = () => {
        // if (board.type === BoardTypeOpen) {
        //     return <Globe/>
        // }
        // return <LockOutline/>
        const memberAvatars = Object.values(members).map((member) =>
            <Avatar key={member.userId} imageUrl={'http://squad.test/assets/avatars/U0528G164U8_m.jpg'} />
        );

        return (
            <div className='invitation'>
                {memberAvatars}
                <ChevronDownIcon color='#6A6F78'/>
            </div>
        );
    }

    return (
        <div className='ShareBoardButton'>
            <Button
                icon={iconForBoardType()}
                onClick={() => {
                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareBoardOpenModal, {board: board.id})
                    setShowShareDialog(!showShareDialog)
                }}
            >

            {/* <Button
                title='Share board'
                size='medium'
                emphasis='primary'
                icon={iconForBoardType()}
                onClick={() => {
                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareBoardOpenModal, {board: board.id})
                    setShowShareDialog(!showShareDialog)
                }}
            > */}
                {/* <FormattedMessage
                    id='CenterPanel.Share'
                    defaultMessage='Share'
                /> */}
            </Button>
            {showShareDialog &&
                <ShareBoardDialog
                    onClose={() => setShowShareDialog(false)}
                    enableSharedBoards={props.enableSharedBoards}
                />}
        </div>
    )
}

export default React.memo(ShareBoardButton)
