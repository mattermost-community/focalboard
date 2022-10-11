// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react'

import Button from '../../widgets/buttons/button'
import CompassIcon from '../../widgets/icons/compassIcon'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import {Board} from '../../blocks/board'

import './shareBoardButton.scss'
import PlaybooksModal from './playbooksModal'

type ShowPlaybooksListProps = {
    numberOfPlaybooks: number
    board: Board
}

const ShowPlaybooksList = (props: ShowPlaybooksListProps) => {
    const [showShareDialog, setShowShareDialog] = useState(false)

    return (
        <>
            <div className='ShareBoardButton'>
                <Button
                    title='Share board'
                    size='medium'
                    active={showShareDialog}
                    emphasis={showShareDialog ? 'active' : 'default'}
                    icon={
                        <CompassIcon
                            icon='product-playbooks'
                            className='GlobeIcon deletePlaybook'
                        />}
                    onClick={() => {
                        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareBoardOpenModal, {board: props.board.id})
                        setShowShareDialog(!showShareDialog)
                        window.showPlaybooksConnected = true
                    }}
                >
                    {props.numberOfPlaybooks}
                </Button>
            </div>
            {showShareDialog &&
                <PlaybooksModal
                    board={props.board}
                    onClose={() => setShowShareDialog(false)}
                />
            }
        </>
    )
}

export default React.memo(ShowPlaybooksList)
