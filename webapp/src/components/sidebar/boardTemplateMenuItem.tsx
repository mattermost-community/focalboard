// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {Board} from '../../blocks/board'
import mutator from '../../mutator'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import EditIcon from '../../widgets/icons/edit'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

type Props = {
    boardTemplate: Board
    isGlobal: boolean
    showBoard: (id: string) => void
    activeBoardId?: string
    intl: IntlShape
}

const addBoardFromTemplate = async (intl: IntlShape, showBoard: (id: string) => void, boardTemplateId: string, activeBoardId?: string, global = false) => {
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

    if (global) {
        await mutator.duplicateFromRootBoard(boardTemplateId, actionDescription, asTemplate, afterRedo, beforeUndo)
    } else {
        await mutator.duplicateBoard(boardTemplateId, actionDescription, asTemplate, afterRedo, beforeUndo)
    }
}

const BoardTemplateMenuItem = React.memo((props: Props) => {
    const {intl, boardTemplate, isGlobal, activeBoardId} = props

    const displayName = boardTemplate.title || intl.formatMessage({id: 'Sidebar.untitled', defaultMessage: 'Untitled'})

    return (
        <Menu.Text
            key={boardTemplate.id}
            id={boardTemplate.id}
            name={displayName}
            icon={<div className='Icon'>{boardTemplate.icon}</div>}
            onClick={() => {
                addBoardFromTemplate(intl, props.showBoard, boardTemplate.id, activeBoardId, isGlobal)
            }}
            rightIcon={!isGlobal &&
                <MenuWrapper stopPropagationOnToggle={true}>
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <Menu.Text
                            icon={<EditIcon/>}
                            id='edit'
                            name={intl.formatMessage({id: 'Sidebar.edit-template', defaultMessage: 'Edit'})}
                            onClick={() => {
                                props.showBoard(boardTemplate.id)
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
            }
        />
    )
})

export default injectIntl(BoardTemplateMenuItem)
