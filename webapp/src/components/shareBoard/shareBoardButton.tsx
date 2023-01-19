// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react'
import {FormattedMessage} from 'react-intl'

import EditStatusPropertyDialog, {StatusCategory} from '../standardProperties/statusProperty/editStatusDialog'

import Button from '../../widgets/buttons/button'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import {useAppSelector} from '../../store/hooks'
import {getCurrentBoard} from '../../store/boards'
import Globe from '../../widgets/icons/globe'
import LockOutline from '../../widgets/icons/lockOutline'
import {BoardTypeOpen} from '../../blocks/board'

import './shareBoardButton.scss'

import ShareBoardDialog from './shareBoard'

type Props = {
    enableSharedBoards: boolean
}
const ShareBoardButton = (props: Props) => {
    const [showShareDialog, setShowShareDialog] = useState(false)
    const board = useAppSelector(getCurrentBoard)

    const iconForBoardType = () => {
        if (board.type === BoardTypeOpen) {
            return <Globe/>
        }
        return <LockOutline/>
    }

    const valueCategories: StatusCategory[] = [
        {
            id: '1',
            title: 'Not Started',
            options: [
                {id: '1', value: 'Pending Design', color: 'propColorPurple'},
                {id: '1', value: 'TODO', color: 'propColorYellow'},
                {id: '1', value: 'Pending Specs', color: 'propColorGray'},
            ],
        },
        {
            id: '2',
            title: 'In progress',
            options: [
                {id: '1', value: 'In Progress', color: 'propColorBrown'},
                {id: '1', value: 'In Review', color: 'propColorRed'},
                {id: '1', value: 'In QA', color: 'propColorPink'},
                {id: '1', value: 'Awaiting Cherrypick', color: 'propColorOrange'},
            ],
        },
        {
            id: '3',
            title: 'Completed',
            options: [
                {id: '1', value: 'Done', color: 'propColorPink'},
                {id: '1', value: 'Branch Cut', color: 'propColorGreen'},
                {id: '1', value: 'Released', color: 'propColorDefault'},
            ],
        },
    ]

    return (
        <div className='ShareBoardButton'>
            <Button
                title='Share board'
                size='medium'
                emphasis='primary'
                icon={iconForBoardType()}
                onClick={() => {
                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareBoardOpenModal, {board: board.id})
                    setShowShareDialog(!showShareDialog)
                }}
            >
                <FormattedMessage
                    id='CenterPanel.Share'
                    defaultMessage='Share'
                />
            </Button>
            {/* {showShareDialog &&
                <ShareBoardDialog
                    onClose={() => setShowShareDialog(false)}
                    enableSharedBoards={props.enableSharedBoards}
                />} */}

            {
                showShareDialog &&
                    <EditStatusPropertyDialog
                        valueCategories={valueCategories}
                        onClose={() => setShowShareDialog(false)}
                    />
            }
        </div>
    )
}

export default React.memo(ShareBoardButton)
