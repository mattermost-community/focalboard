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

import ClockOutline from '../../widgets/icons/clockOutline'

import CheckIcon from '../../widgets/icons/check'

import BlackCheckboxOutline from '../../widgets/icons/blackCheckboxOutline'

import ShareBoardDialog from './shareBoard'

const valueCategoriesInitialValue: StatusCategory[] = [
    {
        id: 'category_id_1',
        title: 'Not Started',
        options: [
            {id: 'status_id_1', value: 'Pending Design', color: 'propColorPurple'},
            {id: 'status_id_2', value: 'TODO', color: 'propColorYellow'},
            {id: 'status_id_3', value: 'Pending Specs', color: 'propColorGray'},
        ],
        emptyState: {
            icon: (<BlackCheckboxOutline/>),
            color: '--sys-dnd-indicator-rgb',
            text: (
                <FormattedMessage
                    id='statusProperty.configDialog.todo.emptyText'
                    defaultMessage='Drag statuses here to consider tasks with these statuses “Not Started”'
                />
            ),
        },
    },
    {
        id: 'category_id_2',
        title: 'In progress',
        options: [
            {id: 'status_id_4', value: 'In Progress', color: 'propColorBrown'},
            {id: 'status_id_5', value: 'In Review', color: 'propColorRed'},
            {id: 'status_id_6', value: 'In QA', color: 'propColorPink'},
            {id: 'status_id_7', value: 'Awaiting Cherrypick', color: 'propColorOrange'},
        ],
        emptyState: {
            icon: (<ClockOutline/>),
            color: '--away-indicator-rgb',
            text: (
                <FormattedMessage
                    id='statusProperty.configDialog.inProgress.emptyText'
                    defaultMessage='Drag statuses here to consider tasks with these statuses “in progress”'
                />
            ),
        },
    },
    {
        id: 'category_id_3',
        title: 'Completed',
        options: [
            {id: 'status_id_20', value: 'Done', color: 'propColorPink'},
            {id: 'status_id_21', value: 'Branch Cut', color: 'propColorGreen'},
            {id: 'status_id_22', value: 'Released', color: 'propColorDefault'},
        ],
        emptyState: {
            icon: (<CheckIcon/>),
            color: '--online-indicator-rgb',
            text: (
                <FormattedMessage
                    id='statusProperty.configDialog.complete.emptyText'
                    defaultMessage='Drag statuses here to consider tasks with these statuses ”Done”'
                />
            ),
        },
    },
]

type Props = {
    enableSharedBoards: boolean
}
const ShareBoardButton = (props: Props) => {
    const [showShareDialog, setShowShareDialog] = useState(false)
    const board = useAppSelector(getCurrentBoard)
    const [valueCategories, setValueCategories] = useState<StatusCategory[]>(valueCategoriesInitialValue)

    const iconForBoardType = () => {
        if (board.type === BoardTypeOpen) {
            return <Globe/>
        }
        return <LockOutline/>
    }

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
                        onUpdate={(updatedValue) => setValueCategories(updatedValue)}
                    />
            }
        </div>
    )
}

export default React.memo(ShareBoardButton)
