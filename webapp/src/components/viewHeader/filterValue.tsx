// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {IPropertyTemplate} from '../../blocks/board'
import {FilterClause} from '../../blocks/filterClause'
import {createFilterGroup} from '../../blocks/filterGroup'
import {BoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import {Utils} from '../../utils'
import Button from '../../widgets/buttons/button'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

type Props = {
    view: BoardView
    filter: FilterClause
    template: IPropertyTemplate
}

const filterValue = (props: Props): JSX.Element|null => {
    const {filter, template, view} = props
    if (filter.condition !== 'includes' && filter.condition !== 'notIncludes') {
        return null
    }

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
                            const filterIndex = view.fields.filter.filters.indexOf(filter)
                            Utils.assert(filterIndex >= 0, "Can't find filter")

                            const filterGroup = createFilterGroup(view.fields.filter)
                            const newFilter = filterGroup.filters[filterIndex] as FilterClause
                            Utils.assert(newFilter, `No filter at index ${filterIndex}`)
                            if (filter.values.includes(o.id)) {
                                newFilter.values = newFilter.values.filter((id) => id !== optionId)
                                mutator.changeViewFilter(view.boardId, view.id, view.fields.filter, filterGroup)
                            } else {
                                newFilter.values.push(optionId)
                                mutator.changeViewFilter(view.boardId, view.id, view.fields.filter, filterGroup)
                            }
                        }}
                    />
                ))}
            </Menu>
        </MenuWrapper>
    )
}

export default filterValue
