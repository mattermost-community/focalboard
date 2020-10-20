// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';

import {BoardTree} from '../boardTree';
import {FilterClause, FilterCondition} from '../filterClause';
import {FilterGroup} from '../filterGroup';
import {Menu} from '../menu';
import mutator from '../mutator';
import {Utils} from '../utils';

type Props = {
    boardTree: BoardTree
    pageX: number
    pageY: number
    onClose: () => void
}

class FilterComponent extends React.Component<Props> {
    render() {
        const {boardTree} = this.props
        const {board, activeView} = boardTree

        const backgroundRef = React.createRef<HTMLDivElement>()

        // TODO: Handle FilterGroups (compound filter statements)
        const filters: FilterClause[] = activeView.filter?.filters.filter((o) => !FilterGroup.isAnInstanceOf(o)) as FilterClause[] || []

        return (
            <div
                className='octo-modal-back'
                ref={backgroundRef}
                onClick={(e) => {
                    if (e.target === backgroundRef.current) {
                        this.props.onClose()
                    }
                }}
            >
                <div
                    className='octo-modal octo-filter-dialog'
                    style={{position: 'absolute', left: this.props.pageX, top: this.props.pageY}}
                >
                    {filters.map((filter) => {
                        const template = board.cardProperties.find((o) => o.id === filter.propertyId)
                        const propertyName = template ? template.name : '(unknown)';		// TODO: Handle error
                        const key = `${filter.propertyId}-${filter.condition}-${filter.values.join(',')}`
                        Utils.log(`FilterClause key: ${key}`)
                        return (<div
                            className='octo-filterclause'
                            key={key}
                        >
                            <div
                                className='octo-button'
                                onClick={(e) => this.propertyClicked(e, filter)}
                            >{propertyName}</div>
                            <div
                                className='octo-button'
                                onClick={(e) => this.conditionClicked(e, filter)}
                            >{FilterClause.filterConditionDisplayString(filter.condition)}</div>
                            {
                                filter.condition === 'includes' || filter.condition === 'notIncludes' ?
                                    <div
                                        className='octo-button'
                                        onClick={(e) => this.valuesClicked(e, filter)}
                                    >
                                        {
                                            filter.values.length > 0 ?
                                                filter.values.join(', ') :
                                                <div>(empty)</div>
                                        }
                                    </div> :
                                    undefined
                            }
                            <div className='octo-spacer'/>
                            <div
                                className='octo-button'
                                onClick={() => this.deleteClicked(filter)}
                            >Delete</div>
                        </div>)
                    })}

                    <br/>

                    <div
                        className='octo-button'
                        onClick={() => this.addFilterClicked()}
                    >+ Add Filter</div>
                </div>
            </div>
        )
    }

    private propertyClicked(e: React.MouseEvent, filter: FilterClause) {
        const {boardTree} = this.props
        const {board, activeView: view} = boardTree

        const filterIndex = view.filter.filters.indexOf(filter)
        Utils.assert(filterIndex >= 0, "Can't find filter")

        Menu.shared.options = board.cardProperties.
            filter((o) => o.type === 'select').
            map((o) => ({id: o.id, name: o.name}))
        Menu.shared.onMenuClicked = (optionId: string, type?: string) => {
            const filterGroup = new FilterGroup(view.filter)
            const newFilter = filterGroup.filters[filterIndex] as FilterClause
            Utils.assert(newFilter, `No filter at index ${filterIndex}`)
            if (newFilter.propertyId !== optionId) {
                newFilter.propertyId = optionId
                newFilter.values = []
                mutator.changeViewFilter(view, filterGroup)
            }
        }
        Menu.shared.showAtElement(e.target as HTMLElement)
    }

    private conditionClicked(e: React.MouseEvent, filter: FilterClause) {
        const {boardTree} = this.props
        const {activeView: view} = boardTree

        const filterIndex = view.filter.filters.indexOf(filter)
        Utils.assert(filterIndex >= 0, "Can't find filter")

        Menu.shared.options = [
            {id: 'includes', name: 'includes'},
            {id: 'notIncludes', name: "doesn't include"},
            {id: 'isEmpty', name: 'is empty'},
            {id: 'isNotEmpty', name: 'is not empty'},
        ]
        Menu.shared.onMenuClicked = (optionId: string, type?: string) => {
            const filterGroup = new FilterGroup(view.filter)
            const newFilter = filterGroup.filters[filterIndex] as FilterClause
            Utils.assert(newFilter, `No filter at index ${filterIndex}`)
            if (newFilter.condition !== optionId) {
                newFilter.condition = optionId as FilterCondition
                mutator.changeViewFilter(view, filterGroup)
            }
        }
        Menu.shared.showAtElement(e.target as HTMLElement)
    }

    private valuesClicked(e: React.MouseEvent, filter: FilterClause) {
        const {boardTree} = this.props
        const {board, activeView: view} = boardTree

        const template = board.cardProperties.find((o) => o.id === filter.propertyId)
        if (!template) {
            return
        }

        // BUGBUG: This index will be wrong if someone else changes the filter array after a change. Solution is to make Menu a React component.
        const filterIndex = view.filter.filters.indexOf(filter)
        Utils.assert(filterIndex >= 0, "Can't find filter")

        Menu.shared.options = template.options.map((o) => ({id: o.value, name: o.value, type: 'switch', isOn: filter.values.includes(o.value)}))
        Menu.shared.onMenuToggled = async (optionId: string, isOn: boolean) => {
            // const index = view.filter.filters.indexOf(filter)
            const filterGroup = new FilterGroup(view.filter)
            const newFilter = filterGroup.filters[filterIndex] as FilterClause
            Utils.assert(newFilter, `No filter at index ${filterIndex}`)
            if (isOn) {
                newFilter.values.push(optionId)
                mutator.changeViewFilter(view, filterGroup)
            } else {
                newFilter.values = newFilter.values.filter((o) => o !== optionId)
                mutator.changeViewFilter(view, filterGroup)
            }
        }
        Menu.shared.showAtElement(e.target as HTMLElement)
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

export {FilterComponent}
