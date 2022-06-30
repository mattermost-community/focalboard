// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {render, screen} from '@testing-library/react'
import '@testing-library/jest-dom'

import userEvent from '@testing-library/user-event'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'

import {wrapIntl} from '../../testUtils'

import Select from './select'

function selectPropertyTemplate(): IPropertyTemplate {
    return {
        id: 'select-template',
        name: 'select',
        type: 'select',
        options: [
            {
                id: 'option-1',
                value: 'one',
                color: 'propColorDefault',
            },
            {
                id: 'option-2',
                value: 'two',
                color: 'propColorGreen',
            },
            {
                id: 'option-3',
                value: 'three',
                color: 'propColorRed',
            },
        ],
    }
}

describe('components/properties/select', () => {
    const nonEditableSelectTestId = 'select-non-editable'

    const clearButton = () => screen.queryByRole('button', {name: /clear/i})

    it('shows the selected option', () => {
        const propertyTemplate = selectPropertyTemplate()
        const option = propertyTemplate.options[0]

        const {container} = render(wrapIntl(
            <Select
                board={{} as Board}
                card={{} as Card}
                propertyTemplate={propertyTemplate}
                propertyValue={option.id}
                readOnly={true}
                showEmptyPlaceholder={false}
            />,
        ))

        expect(screen.getByText(option.value)).toBeInTheDocument()
        expect(clearButton()).not.toBeInTheDocument()

        expect(container).toMatchSnapshot()
    })

    it('shows empty placeholder', () => {
        const propertyTemplate = selectPropertyTemplate()
        const emptyValue = 'Empty'

        const {container} = render(wrapIntl(
            <Select
                board={{} as Board}
                card={{} as Card}
                showEmptyPlaceholder={true}
                propertyTemplate={propertyTemplate}
                propertyValue={''}
                readOnly={true}
            />,
        ))

        expect(screen.getByText(emptyValue)).toBeInTheDocument()
        expect(clearButton()).not.toBeInTheDocument()

        expect(container).toMatchSnapshot()
    })

    it('shows the menu with options when preview is clicked', () => {
        const propertyTemplate = selectPropertyTemplate()
        const selected = propertyTemplate.options[1]

        render(wrapIntl(
            <Select
                board={{} as Board}
                card={{} as Card}
                propertyTemplate={propertyTemplate}
                propertyValue={selected.id}
                showEmptyPlaceholder={false}
                readOnly={false}
            />,
        ))

        userEvent.click(screen.getByTestId(nonEditableSelectTestId))

        // check that all options are visible
        for (const option of propertyTemplate.options) {
            const elements = screen.getAllByText(option.value)

            // selected option is rendered twice: in the input and inside the menu
            const expected = option.id === selected.id ? 2 : 1
            expect(elements.length).toBe(expected)
        }

        expect(clearButton()).toBeInTheDocument()
    })

    it('can select the option from menu', () => {
        const propertyTemplate = selectPropertyTemplate()
        const optionToSelect = propertyTemplate.options[2]

        render(wrapIntl(
            <Select
                board={{} as Board}
                card={{} as Card}
                propertyTemplate={propertyTemplate}
                propertyValue={''}
                showEmptyPlaceholder={false}
                readOnly={false}
            />,
        ))

        userEvent.click(screen.getByTestId(nonEditableSelectTestId))
        userEvent.click(screen.getByText(optionToSelect.value))

        expect(clearButton()).not.toBeInTheDocument()
        expect('on-change').toHaveBeenCalledWith(optionToSelect.id)
    })

    it('can clear the selected option', () => {
        const propertyTemplate = selectPropertyTemplate()
        const selected = propertyTemplate.options[1]

        render(wrapIntl(
            <Select
                board={{} as Board}
                card={{} as Card}
                propertyTemplate={propertyTemplate}
                propertyValue={selected.id}
                showEmptyPlaceholder={false}
                readOnly={false}
            />,
        ))

        userEvent.click(screen.getByTestId(nonEditableSelectTestId))

        const clear = clearButton()
        expect(clear).toBeInTheDocument()
        userEvent.click(clear!)

        expect('on-delete-value').toHaveBeenCalled()
    })

    it('can create new option', () => {
        const propertyTemplate = selectPropertyTemplate()
        const initialOption = propertyTemplate.options[0]
        const newOption = 'new-option'

        render(wrapIntl(
            <Select
                board={{} as Board}
                card={{} as Card}
                propertyTemplate={propertyTemplate}
                propertyValue={initialOption.id}
                showEmptyPlaceholder={false}
                readOnly={false}
            />,
        ))

        userEvent.click(screen.getByTestId(nonEditableSelectTestId))
        userEvent.type(screen.getByRole('combobox', {name: /value selector/i}), `${newOption}{enter}`)

        expect('on-create').toHaveBeenCalledWith(newOption)
    })
})
