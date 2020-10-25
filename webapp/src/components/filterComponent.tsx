// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, IntlShape, injectIntl} from 'react-intl'

import {IPropertyTemplate} from '../blocks/board'

import {BoardTree} from '../viewModel/boardTree'
import {FilterClause, FilterCondition} from '../filterClause'
import {FilterGroup} from '../filterGroup'
import mutator from '../mutator'
import {Utils} from '../utils'

import MenuWrapper from '../widgets/menuWrapper'
import Menu from '../widgets/menu'

type Props = {
    boardTree: BoardTree
    onClose: () => void
    intl: IntlShape
}

class FilterComponent extends React.Component<Props> {
    private node: React.RefObject<HTMLDivElement>

    public shouldComponentUpdate(): boolean {
        return true
    }

    public constructor(props: Props) {
        super(props)
        this.node = React.createRef()
    }

    public componentDidMount(): void {
        document.addEventListener('click', this.closeOnBlur, true)
    }

    public componentWillUnmount(): void {
        document.removeEventListener('click', this.closeOnBlur, true)
    }

    private closeOnBlur = (e: Event) => {
        if (this.node && this.node.current && e.target && this.node.current.contains(e.target as Node)) {
            return
        }

        this.props.onClose()
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
            <div
                className='octo-modal octo-filter-dialog'
                style={{position: 'absolute', top: 25, left: -200}}
                ref={this.node}
            >
                {filters.map((filter) => {
                    const template = board.cardProperties.find((o) => o.id === filter.propertyId)
                    const propertyName = template ? template.name : '(unknown)'		// TODO: Handle error
                    const key = `${filter.propertyId}-${filter.condition}-${filter.values.join(',')}`
                    Utils.log(`FilterClause key: ${key}`)
                    return (<div
                        className='octo-filterclause'
                        key={key}
                            >
                        <MenuWrapper>
                            <div className='octo-button'>{propertyName}</div>
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
                            <div className='octo-button'>{FilterClause.filterConditionDisplayString(filter.condition, intl)}</div>
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
                            this.filterValue(filter, template)
                        }
                        <div className='octo-spacer'/>
                        <div
                            className='octo-button'
                            onClick={() => this.deleteClicked(filter)}
                        >
                            <FormattedMessage
                                id='FilterComponent.delete'
                                defaultMessage='Delete'
                            />
                        </div>
                    </div>)
                })}

                <br/>

                <div
                    className='octo-button'
                    onClick={() => this.addFilterClicked()}
                >
                    <FormattedMessage
                        id='FilterComponent.add-filter'
                        defaultMessage='+ Add Filter'
                    />
                </div>
            </div>
        )
    }

    private filterValue(filter: FilterClause, template: IPropertyTemplate): JSX.Element {
        const {boardTree} = this.props
        const {board, activeView: view} = boardTree

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

            if (!template) {
                return null
            }

            return (
                <MenuWrapper>
                    <div className='octo-button'>{displayValue}</div>
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
