// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react'
import {FormattedMessage} from 'react-intl'

import Button from '../../widgets/buttons/button'
import DeleteIcon from '../../widgets/icons/delete'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'

import './shareBoardButton.scss'

import ShareBoardDialog from './shareBoard'

type Props = {
    boardId: string
}
const ShareBoardButton = React.memo((props: Props) => {
    const [showShareDialog, setShowShareDialog] = useState(false)

    return (
        <div className='ShareBoardButton'>
            <Button
                title='Share board'
                size='medium'
                emphasis='tertiary'
                icon={<DeleteIcon/>}
                onClick={() => {
                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareBoardOpenModal, {board: props.boardId, shareBoardEnabled: isOn})
                    setShowShareDialog(!showShareDialog)
                }}
            >
                <FormattedMessage
                    id='CenterPanel.Share'
                    defaultMessage='Share'
                />
            </Button>
            {showShareDialog &&
                <ShareBoardDialog
                    onClose={() => setShowShareDialog(false)}
                    boardId={props.boardId}
                />
            }
        </div>
    )
})

export default ShareBoardButton
