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

    test('duplicate property types', () => {
        const boardWithProps = TestBlockFactory.createBoard()
        boardWithProps.fields.cardProperties.push({
            id: 'number-property-1',
            name: 'A Number Property - 1',
            type: 'number',
            options: [],
        })
        boardWithProps.fields.cardProperties.push({
            id: 'number-property-2',
            name: 'A Number Propert - 2y',
            type: 'number',
            options: [],
        })

        const component = (
            <KanbanCalculationOptions
                value={'count'}
                property={boardWithProps.fields.cardProperties[1]}
                menuOpen={true}
                onChange={() => {}}
                cardProperties={boardWithProps.fields.cardProperties}
            />
        )

        const {getAllByText} = render(component)
        const sumOptions = getAllByText('Sum')
        expect(sumOptions).toBeDefined()
        expect(sumOptions.length).toBe(1)
    })
})
