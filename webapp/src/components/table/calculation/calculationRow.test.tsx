// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import {IntlProvider} from 'react-intl'
import React from 'react'

import {render} from '@testing-library/react'
import '@testing-library/jest-dom'

import {TestBlockFactory} from '../../../test/testBlockFactory'
import {FetchMock} from '../../../test/fetchMock'
import 'isomorphic-fetch'

import CalculationRow from './calculationRow'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

const wrapProviders = (children: any) => {
    return (
        <DndProvider backend={HTML5Backend}>
            <IntlProvider locale='en'>{children}</IntlProvider>
        </DndProvider>
    )
}

describe('components/table/calculation/CalculationRow', () => {
    const board = TestBlockFactory.createBoard()
    board.fields.cardProperties.push({
        id: 'property_2',
        name: 'Property 2',
        type: 'text',
        options: [],
    })
    board.fields.cardProperties.push({
        id: 'property_3',
        name: 'Property 3',
        type: 'text',
        options: [],
    })
    board.fields.cardProperties.push({
        id: 'property_4',
        name: 'Property 4',
        type: 'text',
        options: [],
    })

    const view = TestBlockFactory.createBoardView(board)
    view.fields.visiblePropertyIds.push(...['property_2', 'property_3', 'property_4'])

    const card = TestBlockFactory.createCard(board)
    card.fields.properties.property_2 = 'Foo'
    card.fields.properties.property_3 = 'Bar'
    card.fields.properties.property_4 = 'Baz'

    const card2 = TestBlockFactory.createCard(board)
    card2.fields.properties.property_2 = 'Lorem'
    card2.fields.properties.property_3 = ''
    card2.fields.properties.property_4 = 'Baz'

    test('should render three calculation elements', async () => {
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, card])))

        const component = wrapProviders(
            <CalculationRow
                board={board}
                cards={[card, card2]}
                activeView={view}
                resizingColumn={''}
                offset={0}
                readonly={false}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot', async () => {
        board.fields.columnCalculations = {
            property_2: 'count',
            property_3: 'countValue',
            property_4: 'countUniqueValue',
        }

        const component = wrapProviders(
            <CalculationRow
                board={board}
                cards={[card, card2]}
                activeView={view}
                resizingColumn={''}
                offset={0}
                readonly={false}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
