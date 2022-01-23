// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useIntl} from 'react-intl'

import {Board} from '../../blocks/board'
import mutator from '../../mutator'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import EditIcon from '../../widgets/icons/edit'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

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
    showBoard: (id: string) => Promise<void>
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
                mutator.addBoardFromTemplate(intl, showBoard, () => showBoard(activeBoardId || ''), boardTemplate.id || '', isGlobal)
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
