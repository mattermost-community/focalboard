// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {fireEvent, render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {mocked} from 'ts-jest/utils'

import {wrapIntl} from '../../testUtils'
import {TestBlockFactory} from '../../test/testBlockFactory'
import mutator from '../../mutator'

import CardDetailProperties from './cardDetailProperties'

jest.mock('../../mutator')
const mockedMutator = mocked(mutator, true)

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

    test('should match snapshot', async () => {
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
        expect(container).toMatchSnapshot()
    })

    test('rename select property', async () => {
        const cards = [card]
        const component = wrapIntl((
            <CardDetailProperties
                board={board!}
                card={card}
                cards={cards}
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

        const newName = 'Owner - Renamed'
        const propertyNameInput = container.querySelector('.PropertyMenu.menu-textbox')
        expect(propertyNameInput).toBeDefined()
        userEvent.type(propertyNameInput!, `${newName}{enter}`)
        fireEvent.click(propertyLabel!)

        // should be called once on renaming the property
        const propertyTemplate = board.fields.cardProperties[0]
        expect(mockedMutator.changePropertyTypeAndName).toHaveBeenCalledTimes(1)
        expect(mockedMutator.changePropertyTypeAndName).toHaveBeenCalledWith(board, cards, propertyTemplate, 'select', newName)
    })
})
