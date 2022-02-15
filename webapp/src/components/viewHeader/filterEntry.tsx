// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {FilterClause, areEqual as areFilterClausesEqual} from '../../blocks/filterClause'
import {createFilterGroup, isAFilterGroupInstance} from '../../blocks/filterGroup'
import mutator from '../../mutator'
import {OctoUtils} from '../../octoUtils'
import {Utils} from '../../utils'
import {Board, IPropertyTemplate} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import Button from '../../widgets/buttons/button'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import FilterValue from './filterValue'

import './filterEntry.scss'

type Props = {
    board: Board
    view: BoardView
    conditionClicked: (optionId: string, filter: FilterClause) => void
    filter: FilterClause
}

const FilterEntry = (props: Props): JSX.Element => {
    const {board, view, filter} = props
    const intl = useIntl()

    const template = board.cardProperties.find((o: IPropertyTemplate) => o.id === filter.propertyId)
    const propertyName = template ? template.name : '(unknown)'
    const key = `${filter.propertyId}-${filter.condition}-${filter.values.join(',')}`
    return (
        <div
            className='FilterEntry'
            key={key}
        >
            <MenuWrapper>
                <Button>{propertyName}</Button>
                <Menu>
                    {board.cardProperties.filter((o: IPropertyTemplate) => o.type === 'select' || o.type === 'multiSelect').map((o: IPropertyTemplate) => (
                        <Menu.Text
                            key={o.id}
                            id={o.id}
                            name={o.name}
                            onClick={(optionId: string) => {
                                const filterIndex = view.fields.filter.filters.indexOf(filter)
                                Utils.assert(filterIndex >= 0, "Can't find filter")
                                const filterGroup = createFilterGroup(view.fields.filter)
                                const newFilter = filterGroup.filters[filterIndex] as FilterClause
                                Utils.assert(newFilter, `No filter at index ${filterIndex}`)
                                if (newFilter.propertyId !== optionId) {
                                    newFilter.propertyId = optionId
                                    newFilter.values = []
                                    mutator.changeViewFilter(props.board.id, view.id, view.fields.filter, filterGroup)
                                }
                            }}
                        />))}
                </Menu>
            </MenuWrapper>
            <MenuWrapper>
                <Button>{OctoUtils.filterConditionDisplayString(filter.condition, intl)}</Button>
                <Menu>
                    <Menu.Text
                        id='includes'
                        name={intl.formatMessage({id: 'Filter.includes', defaultMessage: 'includes'})}
                        onClick={(id) => props.conditionClicked(id, filter)}
                    />
                    <Menu.Text
                        id='notIncludes'
                        name={intl.formatMessage({id: 'Filter.not-includes', defaultMessage: 'doesn\'t include'})}
                        onClick={(id) => props.conditionClicked(id, filter)}
                    />
                    <Menu.Text
                        id='isEmpty'
                        name={intl.formatMessage({id: 'Filter.is-empty', defaultMessage: 'is empty'})}
                        onClick={(id) => props.conditionClicked(id, filter)}
                    />
                    <Menu.Text
                        id='isNotEmpty'
                        name={intl.formatMessage({id: 'Filter.is-not-empty', defaultMessage: 'is not empty'})}
                        onClick={(id) => props.conditionClicked(id, filter)}
                    />
                </Menu>
            </MenuWrapper>
            {template &&
                <FilterValue
                    filter={filter}
                    template={template}
                    view={view}
                />}
            <div className='octo-spacer'/>
            <Button
                onClick={() => {
                    const filterGroup = createFilterGroup(view.fields.filter)
                    filterGroup.filters = filterGroup.filters.filter((o) => isAFilterGroupInstance(o) || !areFilterClausesEqual(o, filter))
                    mutator.changeViewFilter(props.board.id, view.id, view.fields.filter, filterGroup)
                }}
            >
                <FormattedMessage
                    id='FilterComponent.delete'
                    defaultMessage='Delete'
                />
            </Button>
        </div>
    )
}

export default React.memo(FilterEntry)
