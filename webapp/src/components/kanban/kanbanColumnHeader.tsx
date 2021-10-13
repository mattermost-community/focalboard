// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React, {useState, useEffect, useRef} from 'react'
import {FormattedMessage, IntlShape} from 'react-intl'
import {useDrop, useDrag} from 'react-dnd'

import {Constants} from '../../constants'
import {IPropertyOption, IPropertyTemplate, Board, BoardGroup} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import {Card} from '../../blocks/card'
import mutator from '../../mutator'
import IconButton from '../../widgets/buttons/iconButton'
import AddIcon from '../../widgets/icons/add'
import DeleteIcon from '../../widgets/icons/delete'
import HideIcon from '../../widgets/icons/hide'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import Editable from '../../widgets/editable'
import Label from '../../widgets/label'

import {KanbanCalculation} from './calculation/calculation'

type Props = {
    board: Board
    activeView: BoardView
    group: BoardGroup
    groupByProperty?: IPropertyTemplate
    intl: IntlShape
    readonly: boolean
    addCard: (groupByOptionId?: string) => Promise<void>
    propertyNameChanged: (option: IPropertyOption, text: string) => Promise<void>
    onDropToColumn: (srcOption: IPropertyOption, card?: Card, dstOption?: IPropertyOption) => void
    calculationMenuOpen: boolean
    onCalculationMenuOpen: () => void
    onCalculationMenuClose: () => void
}

const defaultCalculation = 'count'
const defaultProperty: IPropertyTemplate = {
    id: Constants.titleColumnId,
} as IPropertyTemplate

export default function KanbanColumnHeader(props: Props): JSX.Element {
    const {board, activeView, intl, group, groupByProperty} = props
    const [groupTitle, setGroupTitle] = useState(group.option.value)

    const headerRef = useRef<HTMLDivElement>(null)

    const [{isDragging}, drag] = useDrag(() => ({
        type: 'column',
        item: group.option,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }))
    const [{isOver}, drop] = useDrop(() => ({
        accept: 'column',
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
        drop: (item: IPropertyOption) => {
            props.onDropToColumn(item, undefined, group.option)
        },
    }), [props.onDropToColumn])

    useEffect(() => {
        setGroupTitle(group.option.value)
    }, [group.option.value])

    drop(drag(headerRef))
    let className = 'octo-board-header-cell KanbanColumnHeader'
    if (isOver) {
        className += ' dragover'
    }

    const groupCalculation = props.activeView.fields.kanbanCalculations[props.group.option.id]
    const calculationValue = groupCalculation ? groupCalculation.calculation : defaultCalculation
    const calculationProperty = groupCalculation ? props.board.fields.cardProperties.find((property) => property.id === groupCalculation.propertyId) || defaultProperty : defaultProperty

    return (
        <div
            key={group.option.id || 'empty'}
            ref={headerRef}
            style={{opacity: isDragging ? 0.5 : 1}}
            className={className}
            draggable={!props.readonly}
        >
            {!group.option.id &&
                <Label
                    title={intl.formatMessage({
                        id: 'BoardComponent.no-property-title',
                        defaultMessage: 'Items with an empty {property} property will go here. This column cannot be removed.',
                    }, {property: groupByProperty!.name})}
                >
                    <FormattedMessage
                        id='BoardComponent.no-property'
                        defaultMessage='No {property}'
                        values={{
                            property: groupByProperty!.name,
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
                            props.propertyNameChanged(group.option, groupTitle)
                        }}
                        onCancel={() => {
                            setGroupTitle(group.option.value)
                        }}
                        readonly={props.readonly}
                        spellCheck={true}
                    />
                </Label>}
            <KanbanCalculation
                cards={group.cards}
                menuOpen={props.calculationMenuOpen}
                value={calculationValue}
                property={calculationProperty}
                onMenuClose={props.onCalculationMenuClose}
                onMenuOpen={props.onCalculationMenuOpen}
                cardProperties={board.fields.cardProperties}
                readonly={props.readonly}
                onChange={(data: {calculation: string, propertyId: string}) => {
                    if (data.calculation === calculationValue && data.propertyId === calculationProperty.id) {
                        return
                    }

                    const newCalculations = {
                        ...props.activeView.fields.kanbanCalculations,
                    }
                    newCalculations[props.group.option.id] = {
                        calculation: data.calculation,
                        propertyId: data.propertyId,
                    }

                    mutator.changeViewKanbanCalculations(props.activeView.id, props.activeView.fields.kanbanCalculations, newCalculations)
                }}
            />
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
                                        onClick={() => mutator.deletePropertyOption(board, groupByProperty!, group.option)}
                                    />
                                    <Menu.Separator/>
                                    {Object.entries(Constants.menuColors).map(([key, color]) => (
                                        <Menu.Color
                                            key={key}
                                            id={key}
                                            name={color}
                                            onClick={() => mutator.changePropertyOptionColor(board, groupByProperty!, group.option, key)}
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
