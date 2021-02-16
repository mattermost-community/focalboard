// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {IPropertyTemplate} from '../blocks/board'
import {FilterClause, FilterCondition} from '../blocks/filterClause'
import {FilterGroup} from '../blocks/filterGroup'
import mutator from '../mutator'
import {OctoUtils} from '../octoUtils'
import {Utils} from '../utils'
import {BoardTree} from '../viewModel/boardTree'
import Button from '../widgets/buttons/button'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'

import './filterComponent.scss'
import Modal from './modal'

type Props = {
    boardTree: BoardTree
    onClose: () => void
    intl: IntlShape
}

class FilterComponent extends React.Component<Props> {
    public shouldComponentUpdate(): boolean {
        return true
    }

    private conditionClicked = (optionId: string, filter: FilterClause): void => {
        const {boardTree} = this.props
        const {activeView: view} = boardTree

        const filterIndex = view.filter.filters.indexOf(filter)
        Utils.assert(filterIndex >= 0, "Can't find filter")

        const filterGroup = new FilterGroup(view.filter)
        const newFilter = filterGroup.filters[filterIndex] as FilterClause

        Utils.assert(newFilter, `No filter at index ${filterIndex}`)
        if (newFilter.condition !== optionId) {
            newFilter.condition = optionId as FilterCondition
            mutator.changeViewFilter(view, filterGroup)
        }
    }

    render(): JSX.Element {
        const {boardTree, intl} = this.props
        const {board, activeView} = boardTree

        // TODO: Handle FilterGroups (compound filter statements)
        const filters: FilterClause[] = activeView.filter?.filters.filter((o) => !FilterGroup.isAnInstanceOf(o)) as FilterClause[] || []

        return (
            <Modal
                onClose={this.props.onClose}
            >
                <div
                    className='FilterComponent'
                >
                    {filters.map((filter) => {
                        const template = board.cardProperties.find((o) => o.id === filter.propertyId)
                        const propertyName = template ? template.name : '(unknown)'		// TODO: Handle error
                        const key = `${filter.propertyId}-${filter.condition}-${filter.values.join(',')}`
                        return (
                            <div
                                className='octo-filterclause'
                                key={key}
                            >
                                <MenuWrapper>
                                    <Button>{propertyName}</Button>
                                    <Menu>
                                        {board.cardProperties.filter((o) => o.type === 'select').map((o) => (
                                            <Menu.Text
                                                key={o.id}
                                                id={o.id}
                                                name={o.name}
                                                onClick={(optionId: string) => {
                                                    const filterIndex = activeView.filter.filters.indexOf(filter)
                                                    Utils.assert(filterIndex >= 0, "Can't find filter")
                                                    const filterGroup = new FilterGroup(activeView.filter)
                                                    const newFilter = filterGroup.filters[filterIndex] as FilterClause
                                                    Utils.assert(newFilter, `No filter at index ${filterIndex}`)
                                                    if (newFilter.propertyId !== optionId) {
                                                        newFilter.propertyId = optionId
                                                        newFilter.values = []
                                                        mutator.changeViewFilter(activeView, filterGroup)
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
                                            onClick={(id) => this.conditionClicked(id, filter)}
                                        />
                                        <Menu.Text
                                            id='notIncludes'
                                            name={intl.formatMessage({id: 'Filter.not-includes', defaultMessage: 'doesn\'t include'})}
                                            onClick={(id) => this.conditionClicked(id, filter)}
                                        />
                                        <Menu.Text
                                            id='isEmpty'
                                            name={intl.formatMessage({id: 'Filter.is-empty', defaultMessage: 'is empty'})}
                                            onClick={(id) => this.conditionClicked(id, filter)}
                                        />
                                        <Menu.Text
                                            id='isNotEmpty'
                                            name={intl.formatMessage({id: 'Filter.is-not-empty', defaultMessage: 'is not empty'})}
                                            onClick={(id) => this.conditionClicked(id, filter)}
                                        />
                                    </Menu>
                                </MenuWrapper>
                                {
                                    template && this.filterValue(filter, template)
                                }
                                <div className='octo-spacer'/>
                                <Button onClick={() => this.deleteClicked(filter)}>
                                    <FormattedMessage
                                        id='FilterComponent.delete'
                                        defaultMessage='Delete'
                                    />
                                </Button>
                            </div>)
                    })}

                    <br/>

                    <Button onClick={() => this.addFilterClicked()}>
                        <FormattedMessage
                            id='FilterComponent.add-filter'
                            defaultMessage='+ Add filter'
                        />
                    </Button>
                </div>
            </Modal>
        )
    }

    private filterValue(filter: FilterClause, template: IPropertyTemplate): JSX.Element | undefined {
        const {boardTree} = this.props
        const {activeView: view} = boardTree

        if (filter.condition === 'includes' || filter.condition === 'notIncludes') {
            let displayValue: string
            if (filter.values.length > 0) {
                displayValue = filter.values.map((id) => {
                    const option = template.options.find((o) => o.id === id)
                    return option?.value || '(Unknown)'
                }).join(', ')
            } else {
                displayValue = '(empty)'
            }

            return (
                <MenuWrapper>
                    <Button>{displayValue}</Button>
                    <Menu>
                        {template.options.map((o) => (
                            <Menu.Switch
                                key={o.id}
                                id={o.id}
                                name={o.value}
                                isOn={filter.values.includes(o.id)}
                                onClick={(optionId) => {
                                    const filterIndex = view.filter.filters.indexOf(filter)
                                    Utils.assert(filterIndex >= 0, "Can't find filter")

                                    const filterGroup = new FilterGroup(view.filter)
                                    const newFilter = filterGroup.filters[filterIndex] as FilterClause
                                    Utils.assert(newFilter, `No filter at index ${filterIndex}`)
                                    if (filter.values.includes(o.id)) {
                                        newFilter.values = newFilter.values.filter((id) => id !== optionId)
                                        mutator.changeViewFilter(view, filterGroup)
                                    } else {
                                        newFilter.values.push(optionId)
                                        mutator.changeViewFilter(view, filterGroup)
                                    }
                                }}
                            />
                        ))}
                    </Menu>
                </MenuWrapper>
            )
        }

        return undefined
    }

    private deleteClicked(filter: FilterClause) {
        const {boardTree} = this.props
        const {activeView: view} = boardTree

        const filterGroup = new FilterGroup(view.filter)
        filterGroup.filters = filterGroup.filters.filter((o) => FilterGroup.isAnInstanceOf(o) || !o.isEqual(filter))

        mutator.changeViewFilter(view, filterGroup)
    }

    private addFilterClicked() {
        const {boardTree} = this.props
        const {board, activeView: view} = boardTree

        const filters = view.filter?.filters.filter((o) => !FilterGroup.isAnInstanceOf(o)) as FilterClause[] || []
        const filterGroup = new FilterGroup(view.filter)
        const filter = new FilterClause()

        // Pick the first select property that isn't already filtered on
        const selectProperty = board.cardProperties.
            filter((o) => !filters.find((f) => f.propertyId === o.id)).
            find((o) => o.type === 'select')
        if (selectProperty) {
            filter.propertyId = selectProperty.id
        }
        filterGroup.filters.push(filter)

        mutator.changeViewFilter(view, filterGroup)
    }
}

export default injectIntl(FilterComponent)
