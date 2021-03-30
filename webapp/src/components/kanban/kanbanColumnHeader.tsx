// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React, {useState, useEffect} from 'react'
import {FormattedMessage, IntlShape} from 'react-intl'

import {Constants} from '../../constants'
import {IPropertyOption} from '../../blocks/board'
import mutator from '../../mutator'
import {BoardTree, BoardTreeGroup} from '../../viewModel/boardTree'
import Button from '../../widgets/buttons/button'
import IconButton from '../../widgets/buttons/iconButton'
import AddIcon from '../../widgets/icons/add'
import DeleteIcon from '../../widgets/icons/delete'
import HideIcon from '../../widgets/icons/hide'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import Editable from '../../widgets/editable'

type Props = {
    boardTree: BoardTree
    group: BoardTreeGroup
    intl: IntlShape
    readonly: boolean
    addCard: (groupByOptionId?: string) => Promise<void>
    propertyNameChanged: (option: IPropertyOption, text: string) => Promise<void>
    onDropToColumn: (option: IPropertyOption) => void
    setDraggedHeaderOption: (draggedHeaderOption?: IPropertyOption) => void
}

export default function KanbanColumnHeader(props: Props): JSX.Element {
    const {boardTree, intl, group} = props
    const {activeView} = boardTree
    const [groupTitle, setGroupTitle] = useState(group.option.value)

    useEffect(() => {
        setGroupTitle(group.option.value)
    }, [group.option.value])

    const ref = React.createRef<HTMLDivElement>()
    return (
        <div
            key={group.option.id || 'empty'}
            ref={ref}
            className='octo-board-header-cell KanbanColumnHeader'

            draggable={!props.readonly}
            onDragStart={() => {
                props.setDraggedHeaderOption(group.option)
            }}
            onDragEnd={() => {
                props.setDraggedHeaderOption(undefined)
            }}

            onDragOver={(e) => {
                ref.current?.classList.add('dragover')
                e.preventDefault()
            }}
            onDragEnter={(e) => {
                ref.current?.classList.add('dragover')
                e.preventDefault()
            }}
            onDragLeave={(e) => {
                ref.current?.classList.remove('dragover')
                e.preventDefault()
            }}
            onDrop={(e) => {
                ref.current?.classList.remove('dragover')
                e.preventDefault()
                props.onDropToColumn(group.option)
            }}
        >
            {!group.option.id &&
                <div
                    className='octo-label'
                    title={intl.formatMessage({
                        id: 'BoardComponent.no-property-title',
                        defaultMessage: 'Items with an empty {property} property will go here. This column cannot be removed.',
                    }, {property: boardTree.groupByProperty!.name})}
                >
                    <FormattedMessage
                        id='BoardComponent.no-property'
                        defaultMessage='No {property}'
                        values={{
                            property: boardTree.groupByProperty!.name,
                        }}
                    />
                </div>}
            {group.option.id &&
                <Editable
                    className={`octo-label ${group.option.color}`}
                    value={groupTitle}
                    placeholderText='New Select'
                    onChange={setGroupTitle}
                    onSave={() => {
                        if (groupTitle.trim() === '') {
                            setGroupTitle(group.option.value)
                        }
                        props.propertyNameChanged(group.option, groupTitle)
                    }}
                    onCancel={() => {
                        setGroupTitle(group.option.value)
                    }}
                    readonly={props.readonly}
                />}
            <Button>{`${group.cards.length}`}</Button>
            <div className='octo-spacer'/>
            {!props.readonly &&
                <>
                    <MenuWrapper>
                        <IconButton icon={<OptionsIcon/>}/>
                        <Menu>
                            <Menu.Text
                                id='hide'
                                icon={<HideIcon/>}
                                name={intl.formatMessage({id: 'BoardComponent.hide', defaultMessage: 'Hide'})}
                                onClick={() => mutator.hideViewColumn(activeView, group.option.id || '')}
                            />
                            {group.option.id &&
                                <>
                                    <Menu.Text
                                        id='delete'
                                        icon={<DeleteIcon/>}
                                        name={intl.formatMessage({id: 'BoardComponent.delete', defaultMessage: 'Delete'})}
                                        onClick={() => mutator.deletePropertyOption(boardTree, boardTree.groupByProperty!, group.option)}
                                    />
                                    <Menu.Separator/>
                                    {Constants.menuColors.map((color) => (
                                        <Menu.Color
                                            key={color.id}
                                            id={color.id}
                                            name={color.name}
                                            onClick={() => mutator.changePropertyOptionColor(boardTree.board, boardTree.groupByProperty!, group.option, color.id)}
                                        />
                                    ))}
                                </>}
                        </Menu>
                    </MenuWrapper>
                    <IconButton
                        icon={<AddIcon/>}
                        onClick={() => props.addCard(group.option.id)}
                    />
                </>
            }
        </div>
    )
}
