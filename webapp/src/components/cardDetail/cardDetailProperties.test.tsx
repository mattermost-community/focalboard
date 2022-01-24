// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render, screen, act} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {mocked} from 'ts-jest/utils'
import '@testing-library/jest-dom'
import {createIntl} from 'react-intl'

import {PropertyType} from '../../blocks/board'
import {wrapIntl} from '../../testUtils'
import {TestBlockFactory} from '../../test/testBlockFactory'
import mutator from '../../mutator'
import {propertyTypesList, typeDisplayName} from '../../widgets/propertyMenu'

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
        {
            id: 'property_id_2',
            name: 'MockStatus',
            type: 'number',
            options: [],
        },
    ]

    const view = TestBlockFactory.createBoardView(board)
    view.fields.sortOptions = []
    view.fields.groupById = undefined
    view.fields.hiddenOptionIds = []
    const views = [view]

    const card = TestBlockFactory.createCard(board)
    card.fields.properties.property_id_1 = 'property_value_id_1'
    card.fields.properties.property_id_2 = '1234'

    const cardTemplate = TestBlockFactory.createCard(board)
    cardTemplate.fields.isTemplate = true

    const cards = [card]

    function renderComponent() {
        const component = wrapIntl((
            <CardDetailProperties
                board={board!}
                card={card}
                cards={[card]}
                contents={[]}
                comments={[]}
                activeView={view}
                views={views}
                readonly={false}
            />
        ))

        return render(component)
    }

    it('should match snapshot', async () => {
        const {container} = renderComponent()
        expect(container).toMatchSnapshot()
    })

    it('should show confirmation dialog when deleting existing select property', () => {
        renderComponent()

        const menuElement = screen.getByRole('button', {name: 'Owner'})
        userEvent.click(menuElement)

        const deleteButton = screen.getByRole('button', {name: /delete/i})
        userEvent.click(deleteButton)

        expect(screen.getByRole('heading', {name: 'Confirm Delete Property'})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: /delete/i})).toBeInTheDocument()
    })

    it('should show property types menu', () => {
        const intl = createIntl({locale: 'en'})
        const {container} = renderComponent()

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

    test('rename select property and confirm button on dialog should rename property', async () => {
        const result = renderComponent()

        // rename to "Owner-Renamed"
        onPropertyRenameOpenConfirmationDialog(result.container)

        const propertyTemplate = board.fields.cardProperties[0]

        const confirmButton = result.getByTitle('Change Property')
        expect(confirmButton).toBeDefined()

        userEvent.click(confirmButton!)

        // should be called once on confirming renaming the property
        expect(mockedMutator.changePropertyTypeAndName).toBeCalledTimes(1)
        expect(mockedMutator.changePropertyTypeAndName).toHaveBeenCalledWith(board, cards, propertyTemplate, 'select', 'Owner - Renamed')
    })

    it('should add new number property', async () => {
        renderComponent()

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

    it('cancel button in TypeorNameChange dialog should do nothing', () => {
        const result = renderComponent()
        const container = result.container
        onPropertyRenameOpenConfirmationDialog(container)

        const cancelButton = result.getByTitle('Cancel')
        expect(cancelButton).toBeDefined()

        userEvent.click(cancelButton!)

        expect(container).toMatchSnapshot()
    })

    it('confirmation on delete dialog should delete the property', () => {
        const result = renderComponent()
        const container = result.container

        openDeleteConfirmationDialog(container)

        const propertyTemplate = board.fields.cardProperties[0]

        const confirmButton = result.getByTitle('Delete')
        expect(confirmButton).toBeDefined()

        //click delete button
        userEvent.click(confirmButton!)

        // should be called once on confirming delete
        expect(mockedMutator.deleteProperty).toBeCalledTimes(1)
        expect(mockedMutator.deleteProperty).toBeCalledWith(board, views, cards, propertyTemplate.id)
    })

    it('cancel on delete dialog should do nothing', () => {
        const result = renderComponent()
        const container = result.container

        openDeleteConfirmationDialog(container)

        const cancelButton = result.getByTitle('Cancel')
        expect(cancelButton).toBeDefined()

        userEvent.click(cancelButton!)
        expect(container).toMatchSnapshot()
    })

    function openDeleteConfirmationDialog(container:HTMLElement) {
        const propertyLabel = container.querySelector('.MenuWrapper')
        expect(propertyLabel).toBeDefined()
        userEvent.click(propertyLabel!)

        const deleteOption = container.querySelector('.MenuOption.TextOption')
        expect(propertyLabel).toBeDefined()
        userEvent.click(deleteOption!)

        const confirmDialog = container.querySelector('.dialog.confirmation-dialog-box')
        expect(confirmDialog).toBeDefined()
    }

    function onPropertyRenameOpenConfirmationDialog(container:HTMLElement) {
        const propertyLabel = container.querySelector('.MenuWrapper')
        expect(propertyLabel).toBeDefined()
        userEvent.click(propertyLabel!)

        // write new name in the name text box
        const propertyNameInput = container.querySelector('.PropertyMenu.menu-textbox')
        expect(propertyNameInput).toBeDefined()
        userEvent.type(propertyNameInput!, 'Owner - Renamed{enter}')
        userEvent.click(propertyLabel!)

        const confirmDialog = container.querySelector('.dialog.confirmation-dialog-box')
        expect(confirmDialog).toBeDefined()
    }
})

