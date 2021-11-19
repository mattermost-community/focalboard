// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {render, screen, act} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import {mocked} from 'ts-jest/utils'

import {createIntl} from 'react-intl'

import {wrapIntl} from '../../testUtils'
import {TestBlockFactory} from '../../test/testBlockFactory'
import mutator from '../../mutator'
import {propertyTypesList, typeDisplayName} from '../../widgets/propertyMenu'

import {PropertyType} from '../../blocks/board'

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
    const views = [view]

    const card = TestBlockFactory.createCard(board)
    card.fields.properties.property_id_1 = 'property_value_id_1'
    const cards = [card]

    const cardDetailProps = {
        board,
        card,
        cards,
        contents: [],
        comments: [],
        activeView: view,
        views,
        readonly: false,
    }

    it('should match snapshot', async () => {
        const {container} = render(
            wrapIntl(
                <CardDetailProperties {...cardDetailProps}/>,
            ),
        )
        expect(container).toMatchSnapshot()
    })

    it('should rename existing select property', async () => {
        render(
            wrapIntl(
                <CardDetailProperties {...cardDetailProps}/>,
            ),
        )

        const menuElement = screen.getByRole('button', {name: 'Owner'})
        userEvent.click(menuElement)

        const newName = 'Owner - Renamed'
        const propertyNameInput = screen.getByRole('textbox')
        userEvent.type(propertyNameInput, `${newName}{enter}`)

        const propertyTemplate = board.fields.cardProperties[0]
        expect(mockedMutator.changePropertyTypeAndName).toHaveBeenCalledTimes(1)
        expect(mockedMutator.changePropertyTypeAndName).toHaveBeenCalledWith(board, cards, propertyTemplate, 'select', newName)
    })

    it('should show confirmation dialog when deleting existing select property', () => {
        render(
            wrapIntl(
                <CardDetailProperties {...cardDetailProps}/>,
            ),
        )

        const menuElement = screen.getByRole('button', {name: 'Owner'})
        userEvent.click(menuElement)

        const deleteButton = screen.getByRole('button', {name: /delete/i})
        userEvent.click(deleteButton)

        expect(screen.getByRole('heading', {name: 'Confirm Delete Property'})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /delete/i})).toBeInTheDocument()
    })

    it('should show property types menu', () => {
        const intl = createIntl({locale: 'en'})
        const {container} = render(
            wrapIntl(
                <CardDetailProperties {...cardDetailProps}/>,
            ),
        )

        const menuElement = screen.getByRole('button', {name: /add a property/i})
        userEvent.click(menuElement)
        expect(container).toMatchSnapshot()

        const selectProperty = screen.getByText(/select property type/i)
        expect(selectProperty).toBeInTheDocument()

        propertyTypesList.forEach((type: PropertyType) => {
            const typeButton = screen.getByRole('button', {name: typeDisplayName(intl, type)})
            expect(typeButton).toBeInTheDocument()
        })
    })

    it('should add new number property', async () => {
        render(
            wrapIntl(
                <CardDetailProperties {...cardDetailProps}/>,
            ),
        )

        const menuElement = screen.getByRole('button', {name: /add a property/i})
        userEvent.click(menuElement)

        await act(async () => {
            const numberType = screen.getByRole('button', {name: /number/i})
            userEvent.click(numberType)
        })

        expect(mockedMutator.insertPropertyTemplate).toHaveBeenCalledTimes(1)
        const args = mockedMutator.insertPropertyTemplate.mock.calls[0]
        const template = args[3]
        expect(template).toBeTruthy()
        expect(template!.name).toMatch(/number/i)
        expect(template!.type).toBe('number')
    })
})
