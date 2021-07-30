// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {fireEvent, render} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import userEvent from '@testing-library/user-event'

import {MutableBoardTree} from '../../viewModel/boardTree'
import {TestBlockFactory} from '../../test/testBlockFactory'
import {FetchMock} from '../../test/fetchMock'

import 'isomorphic-fetch'
import {MutableCardTree} from '../../viewModel/cardTree'

import CardDetailProperties from './cardDetailProperties'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

const wrapIntl = (children: any) => <IntlProvider locale='en'>{children}</IntlProvider>

describe('components/cardDetail/CardDetailProperties', () => {
    const board = TestBlockFactory.createBoard()
    board.cardProperties = [
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
    view.sortOptions = []
    view.groupById = undefined
    view.hiddenOptionIds = []

    const card = TestBlockFactory.createCard(board)
    card.properties.property_id_1 = 'property_value_id_1'

    const cardTemplate = TestBlockFactory.createCard(board)
    cardTemplate.isTemplate = true

    const cardTree = new MutableCardTree(card)

    test('should match snapshot', async () => {
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, card, cardTemplate])))
        const boardTree = await MutableBoardTree.sync(board.id, view.id, {})
        expect(boardTree).not.toBeUndefined()

        const componet = wrapIntl((
            <CardDetailProperties
                boardTree={boardTree!}
                cardTree={cardTree}
                readonly={false}
            />
        ))

        const {container} = render(componet)
        expect(container).toMatchSnapshot()
    })

    test('rename select property', async () => {
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, card, cardTemplate])))
        const boardTree = await MutableBoardTree.sync(board.id, view.id, {})
        expect(boardTree).not.toBeUndefined()

        const component = wrapIntl((
            <CardDetailProperties
                boardTree={boardTree!}
                cardTree={cardTree}
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

        // should be called twice,
        // one to sync card tree,
        // and once on renaming the property
        expect(FetchMock.fn).toBeCalledTimes(2)

        // Verify API call was made with renamed property
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const lastAPICallPayload = JSON.parse(FetchMock.fn.mock.calls[1][1].body)
        expect(lastAPICallPayload[0].fields.cardProperties[0].name).toBe('Owner - Renamed')
        expect(lastAPICallPayload[0].fields.cardProperties[0].options.length).toBe(3)
        expect(lastAPICallPayload[0].fields.cardProperties[0].options[0].value).toBe('Jean-Luc Picard')
        expect(lastAPICallPayload[0].fields.cardProperties[0].options[1].value).toBe('William Riker')
        expect(lastAPICallPayload[0].fields.cardProperties[0].options[2].value).toBe('Deanna Troi')
    })
})
