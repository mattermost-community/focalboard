// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {FilterClause} from '../../blocks/filterClause'
import {FilterGroup} from '../../blocks/filterGroup'
import mutator from '../../mutator'
import {OctoUtils} from '../../octoUtils'
import {Utils} from '../../utils'
import {Board} from '../../blocks/board'
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

const FilterEntry = React.memo((props: Props): JSX.Element => {
    const {board, view, filter} = props
    const intl = useIntl()

    const template = board.cardProperties.find((o) => o.id === filter.propertyId)
    const propertyName = template ? template.name : '(unknown)'		// TODO: Handle error
    const key = `${filter.propertyId}-${filter.condition}-${filter.values.join(',')}`
    return (
        <div
            className='FilterEntry'
            key={key}
        >
            <MenuWrapper>
                <Button>{propertyName}</Button>
                <Menu>
                    {board.cardProperties.filter((o) => o.type === 'select' || o.type === 'multiSelect').map((o) => (
                        <Menu.Text
                            key={o.id}
                            id={o.id}
                            name={o.name}
                            onClick={(optionId: string) => {
                                const filterIndex = view.filter.filters.indexOf(filter)
                                Utils.assert(filterIndex >= 0, "Can't find filter")
                                const filterGroup = new FilterGroup(view.filter)
                                const newFilter = filterGroup.filters[filterIndex] as FilterClause
                                Utils.assert(newFilter, `No filter at index ${filterIndex}`)
                                if (newFilter.propertyId !== optionId) {
                                    newFilter.propertyId = optionId
                                    newFilter.values = []
                                    mutator.changeViewFilter(view, filterGroup)
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
                    const filterGroup = new FilterGroup(view.filter)
                    filterGroup.filters = filterGroup.filters.filter((o) => FilterGroup.isAnInstanceOf(o) || !o.isEqual(filter))
                    mutator.changeViewFilter(view, filterGroup)
                }}
            >
                <FormattedMessage
                    id='FilterComponent.delete'
                    defaultMessage='Delete'
                />
            </Button>
        </div>
    )
})

export default FilterEntry
