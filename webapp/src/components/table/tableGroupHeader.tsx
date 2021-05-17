// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React, {useState, useEffect, useRef} from 'react'
import {FormattedMessage, IntlShape} from 'react-intl'
import {useDrop, useDrag} from 'react-dnd'

import {Constants} from '../../constants'
import {IPropertyOption} from '../../blocks/board'
import {Card} from '../../blocks/card'
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
import Label from '../../widgets/label'
import {Utils} from '../../utils'

type Props = {
    boardTree: BoardTree
    group: BoardTreeGroup
    intl: IntlShape
    readonly: boolean
    hideGroup: (groupByOptionId: string) => void
    // addCard: (groupByOptionId?: string) => Promise<void>
    // propertyNameChanged: (option: IPropertyOption, text: string) => Promise<void>
    // onDropToColumn: (srcOption: IPropertyOption, card?: Card, dstOption?: IPropertyOption) => void
}

export default function TableGroupHeader(props: Props): JSX.Element {
    Utils.log('TableGroupHeader')

    const {boardTree, intl, group} = props
    const {activeView} = boardTree
    const [groupTitle, setGroupTitle] = useState(group.option.value)

    const headerRef = useRef<HTMLDivElement>(null)

    const [{isDragging}, drag] = useDrag(() => ({
        type: 'column',
        item: group.option,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }))
    // const [{isOver}, drop] = useDrop(() => ({
    //     accept: 'column',
    //     collect: (monitor) => ({
    //         isOver: monitor.isOver(),
    //     }),
    //     drop: (item: IPropertyOption) => {
    //         props.onDropToColumn(item, undefined, group.option)
    //     },
    // }))

    useEffect(() => {
        setGroupTitle(group.option.value)
    }, [group.option.value])

    // drop(drag(headerRef))
    let className = 'octo-group-header-cell'
    // if (isOver) {
    //     className += ' dragover'
    // }

    return (
        <div
            key={group.option.id || 'empty'}
            ref={headerRef}
            style={{opacity: isDragging ? 0.5 : 1}}
            className={className}
            draggable={!props.readonly}
        >
            <Button
                onClick={() => props.hideGroup(group.option.id)}>{`${group.cards.length}`}</Button>

            {!group.option.id &&
                <Label
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
                </Label>}
            {group.option.id &&
                <Label color={group.option.color}>
                    <Editable
                        value={groupTitle}
                        placeholderText='New Select'
                        onChange={setGroupTitle}
                        onSave={() => {
                            if (groupTitle.trim() === '') {
                                setGroupTitle(group.option.value)
                            }
                            // props.propertyNameChanged(group.option, groupTitle)
                        }}
                        onCancel={() => {
                            setGroupTitle(group.option.value)
                        }}
                        readonly={props.readonly}
                        spellCheck={true}
                    />
                </Label>}
                <div className='octo-spacer'/>
            <Button>{`${group.cards.length}`}</Button>
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
                        // onClick={() => props.addCard(group.option.id)}
                    />
                </>
            }
        </div>
    )
}
