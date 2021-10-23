// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {fireEvent, render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import 'isomorphic-fetch'

import React from 'react'

import {IPropertyTemplate} from '../../blocks/board'
import {FetchMock} from '../../test/fetchMock'
import {TestBlockFactory} from '../../test/testBlockFactory'

import {wrapIntl} from '../../testUtils'

import CardDetailProperties from './cardDetailProperties'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

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

    const card = TestBlockFactory.createCard(board)
    card.fields.properties.property_id_1 = 'property_value_id_1'
    card.fields.properties.property_id_2 = 'property_value_id_2'

    const cardTemplate = TestBlockFactory.createCard(board)
    cardTemplate.fields.isTemplate = true

    function renderComponent() {
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

        const result = render(component)
        return result
    }

    test('should match snapshot', async () => {
        const container = renderComponent().container

        expect(container).toMatchSnapshot()
    })

    test('rename select property and confirm on dialog should rename property', async () => {
        const result = renderComponent()

        onPropertyRenameOpenConfirmationDialog(result.container)

        const confirmButton = result.getByTitle('Change Property')
        expect(confirmButton).toBeDefined()

        userEvent.click(confirmButton!)

        // should be called once on confirming renaming the property
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

    test('cancel btn in TypeorNameChange dialog should do nothing', () => {
        const result = renderComponent()
        const container = result.container
        onPropertyRenameOpenConfirmationDialog(container)

        const cancelButton = result.getByTitle('Cancel')
        expect(cancelButton).toBeDefined()

        userEvent.click(cancelButton!)

        expect(container).toMatchSnapshot()
    })

    test('confirmation on delete dialog should delete the property', () => {
        const result = renderComponent()
        const container = result.container

        openDeleteConfirmationDialog(container)

        const confirmButton = result.getByTitle('Delete')
        expect(confirmButton).toBeDefined()

        //click delete button
        userEvent.click(confirmButton!)

        // should be called once on confirming delete
        expect(FetchMock.fn).toBeCalledTimes(1)

        // Verify API call was made and deleted property does not existing
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const lastAPICallPayload = JSON.parse(FetchMock.fn.mock.calls[0][1].body)
        const deletedPropInPayload = lastAPICallPayload[0].fields.cardProperties.filter(
            (prop:IPropertyTemplate) => prop.id === board.fields.cardProperties[0].id)

        expect(deletedPropInPayload.length).toBe(0)
    })

    test('cancel on delete dialog should do nothing', () => {
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
        fireEvent.click(propertyLabel!)

        const deleteOption = container.querySelector('.MenuOption.TextOption')
        expect(propertyLabel).toBeDefined()
        userEvent.click(deleteOption!)

        const confirmDialog = container.querySelector('.dialog.confirmation-dialog-box')
        expect(confirmDialog).toBeDefined()
    }

    function onPropertyRenameOpenConfirmationDialog(container:HTMLElement) {
        const propertyLabel = container.querySelector('.MenuWrapper')
        expect(propertyLabel).toBeDefined()
        fireEvent.click(propertyLabel!)

        // write new name in the name text box
        const propertyNameInput = container.querySelector('.PropertyMenu.menu-textbox')
        expect(propertyNameInput).toBeDefined()
        userEvent.type(propertyNameInput!, 'Owner - Renamed{enter}')
        fireEvent.click(propertyLabel!)

        const confirmDialog = container.querySelector('.dialog.confirmation-dialog-box')
        expect(confirmDialog).toBeDefined()
    }
})

