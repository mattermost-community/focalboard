// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {fireEvent, render} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import userEvent from '@testing-library/user-event'

import {TestBlockFactory} from '../../test/testBlockFactory'
import {FetchMock} from '../../test/fetchMock'

import 'isomorphic-fetch'

import CardDetailProperties from './cardDetailProperties'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

const wrapIntl = (children: any) => <IntlProvider locale='en'>{children}</IntlProvider>

describe('components/cardDetail/CardDetailProperties', () => {
    const board = TestBlockFactory.createBoard()
    board.fields.cardProperties = [
        {
            id: 'property_id_1',
            name: 'Owner',
            type: 'select',
            options: [
                {
                    color: 'propColorDefault',
                    id: 'property_value_id_1',
                    value: 'Jean-Luc Picard',
                },
                {
                    color: 'propColorDefault',
                    id: 'property_value_id_2',
                    value: 'William Riker',
                },
                {
                    color: 'propColorDefault',
                    id: 'property_value_id_3',
                    value: 'Deanna Troi',
                },
            ],
        },
    ]

    const view = TestBlockFactory.createBoardView(board)
    view.fields.sortOptions = []
    view.fields.groupById = undefined
    view.fields.hiddenOptionIds = []

    const card = TestBlockFactory.createCard(board)
    card.fields.properties.property_id_1 = 'property_value_id_1'

    const cardTemplate = TestBlockFactory.createCard(board)
    cardTemplate.fields.isTemplate = true

    test('should match snapshot', async () => {
        const componet = wrapIntl((
            <CardDetailProperties
                board={board!}
                card={card}
                cards={[card]}
                contents={[]}
                comments={[]}
                activeView={view}
                views={[view]}
                readonly={false}
            />
        ))

        const {container} = render(componet)
        expect(container).toMatchSnapshot()
    })

    test('rename select property', async () => {
        const component = wrapIntl((
            <CardDetailProperties
                board={board!}
                card={card}
                cards={[card]}
                contents={[]}
                comments={[]}
                activeView={view}
                views={[view]}
                readonly={false}
            />
        ))

        const {container} = render(component)
        const propertyLabel = container.querySelector('.MenuWrapper')
        expect(propertyLabel).toBeDefined()
        fireEvent.click(propertyLabel!)

        const propertyNameInput = container.querySelector('.PropertyMenu.menu-textbox')
        expect(propertyNameInput).toBeDefined()
        userEvent.type(propertyNameInput!, 'Owner - Renamed{enter}')
        fireEvent.click(propertyLabel!)

        // should be called once on renaming the property
        expect(FetchMock.fn).toBeCalledTimes(1)

        // Verify API call was made with renamed property
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const lastAPICallPayload = JSON.parse(FetchMock.fn.mock.calls[0][1].body)
        expect(lastAPICallPayload[0].fields.cardProperties[0].name).toBe('Owner - Renamed')
        expect(lastAPICallPayload[0].fields.cardProperties[0].options.length).toBe(3)
        expect(lastAPICallPayload[0].fields.cardProperties[0].options[0].value).toBe('Jean-Luc Picard')
        expect(lastAPICallPayload[0].fields.cardProperties[0].options[1].value).toBe('William Riker')
        expect(lastAPICallPayload[0].fields.cardProperties[0].options[2].value).toBe('Deanna Troi')
    })
})
