// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useIntl, IntlShape} from 'react-intl'

import {Board} from '../../blocks/board'
import mutator from '../../mutator'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import EditIcon from '../../widgets/icons/edit'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import TelemetryClient, {TelemetryCategory, TelemetryActions} from '../../telemetry/telemetryClient'

export const addBoardFromTemplate = async (intl: IntlShape, showBoard: (id: string) => void, boardTemplateId: string, activeBoardId?: string, global = false) => {
    const oldBoardId = activeBoardId
    const afterRedo = async (newBoardId: string) => {
        showBoard(newBoardId)
    }
    const beforeUndo = async () => {
        if (oldBoardId) {
            showBoard(oldBoardId)
        }
    }
    const asTemplate = false
    const actionDescription = intl.formatMessage({id: 'Mutator.new-board-from-template', defaultMessage: 'new board from template'})

    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoardViaTemplate, {boardTemplateId})
    if (global) {
        await mutator.duplicateFromRootBoard(boardTemplateId, actionDescription, asTemplate, afterRedo, beforeUndo)
    } else {
        await mutator.duplicateBoard(boardTemplateId, actionDescription, asTemplate, afterRedo, beforeUndo)
    }
}

type ButtonProps = {
    showBoard: (id: string) => void
    boardTemplate: Board
}

export const BoardTemplateButtonMenu = React.memo((props: ButtonProps) => {
    const intl = useIntl()
    const {showBoard, boardTemplate} = props

    return (
        <MenuWrapper stopPropagationOnToggle={true}>
            <IconButton icon={<OptionsIcon/>}/>
            <Menu position='right'>
                <Menu.Text
                    icon={<EditIcon/>}
                    id='edit'
                    name={intl.formatMessage({id: 'Sidebar.edit-template', defaultMessage: 'Edit'})}
                    onClick={() => {
                        showBoard(boardTemplate.id || '')
                    }}
                />
                <Menu.Text
                    icon={<DeleteIcon/>}
                    id='delete'
                    name={intl.formatMessage({id: 'Sidebar.delete-template', defaultMessage: 'Delete'})}
                    onClick={async () => {
                        await mutator.deleteBlock(boardTemplate, 'delete board template')
                    }}
                />
            </Menu>
        </MenuWrapper>
    )
})

type Props = {
    boardTemplate: Board
    isGlobal: boolean
    showBoard: (id: string) => void
    activeBoardId?: string
}

const BoardTemplateMenuItem = React.memo((props: Props) => {
    const {boardTemplate, isGlobal, activeBoardId, showBoard} = props
    const intl = useIntl()

    const displayName = boardTemplate.title || intl.formatMessage({id: 'Sidebar.untitled', defaultMessage: 'Untitled'})

    return (
        <Menu.Text
            key={boardTemplate.id || ''}
            id={boardTemplate.id || ''}
            name={displayName}
            icon={<div className='Icon'>{boardTemplate.fields.icon}</div>}
            onClick={() => {
                addBoardFromTemplate(intl, showBoard, boardTemplate.id || '', activeBoardId, isGlobal)
            }}
            rightIcon={!isGlobal &&
                <BoardTemplateButtonMenu
                    boardTemplate={boardTemplate}
                    showBoard={showBoard}
                />
            }
        />
    )
})

export default BoardTemplateMenuItem
