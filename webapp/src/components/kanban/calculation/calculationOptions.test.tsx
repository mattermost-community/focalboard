// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {render} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {TestBlockFactory} from '../../../test/testBlockFactory'

import {KanbanCalculationOptions} from './calculationOptions'

describe('components/kanban/calculations/KanbanCalculationOptions', () => {
    const board = TestBlockFactory.createBoard()

    test('base case', () => {
        const component = (
            <KanbanCalculationOptions
                value={'count'}
                property={board.fields.cardProperties[1]}
                menuOpen={false}
                onChange={() => {}}
                cardProperties={board.fields.cardProperties}
            />
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('with menu open', () => {
        const component = (
            <KanbanCalculationOptions
                value={'count'}
                property={board.fields.cardProperties[1]}
                menuOpen={true}
                onChange={() => {}}
                cardProperties={board.fields.cardProperties}
            />
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('with submenu open', () => {
        const component = (
            <KanbanCalculationOptions
                value={'count'}
                property={board.fields.cardProperties[1]}
                menuOpen={true}
                onChange={() => {}}
                cardProperties={board.fields.cardProperties}
            />
        )

        const {container, getByText} = render(component)
        const countUniqueValuesOption = getByText('Count Unique Values')
        expect(countUniqueValuesOption).toBeDefined()
        userEvent.hover(countUniqueValuesOption)
        expect(container).toMatchSnapshot()
    })
})
