// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {render, screen} from '@testing-library/react'
import '@testing-library/jest-dom'

import userEvent from '@testing-library/user-event'

import {IPropertyTemplate} from '../../../blocks/board'

import {wrapIntl} from '../../../testUtils'

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

function selectCallbacks() {
    return {
        onCreate: jest.fn(),
        onChange: jest.fn(),
        onChangeColor: jest.fn(),
        onDeleteOption: jest.fn(),
        onDeleteValue: jest.fn(),
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
                emptyValue={''}
                propertyTemplate={propertyTemplate}
                propertyValue={option.id}
                isEditable={false}
                {...selectCallbacks()}
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
                emptyValue={emptyValue}
                propertyTemplate={propertyTemplate}
                propertyValue={''}
                isEditable={false}
                {...selectCallbacks()}
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
                emptyValue={''}
                propertyTemplate={propertyTemplate}
                propertyValue={selected.id}
                isEditable={true}
                {...selectCallbacks()}
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
        const onChange = jest.fn()

        render(wrapIntl(
            <Select
                emptyValue={'Empty'}
                propertyTemplate={propertyTemplate}
                propertyValue={''}
                isEditable={true}
                {...selectCallbacks()}
                onChange={onChange}
            />,
        ))

        userEvent.click(screen.getByTestId(nonEditableSelectTestId))
        userEvent.click(screen.getByText(optionToSelect.value))

        expect(clearButton()).not.toBeInTheDocument()
        expect(onChange).toHaveBeenCalledWith(optionToSelect.id)
    })

    it('can clear the selected option', () => {
        const propertyTemplate = selectPropertyTemplate()
        const selected = propertyTemplate.options[1]
        const onDeleteValue = jest.fn()

        render(wrapIntl(
            <Select
                emptyValue={'Empty'}
                propertyTemplate={propertyTemplate}
                propertyValue={selected.id}
                isEditable={true}
                {...selectCallbacks()}
                onDeleteValue={onDeleteValue}
            />,
        ))

        userEvent.click(screen.getByTestId(nonEditableSelectTestId))

        const clear = clearButton()
        expect(clear).toBeInTheDocument()
        userEvent.click(clear!)

        expect(onDeleteValue).toHaveBeenCalled()
    })

    it('can create new option', () => {
        const propertyTemplate = selectPropertyTemplate()
        const initialOption = propertyTemplate.options[0]
        const newOption = 'new-option'
        const onCreate = jest.fn()

        render(wrapIntl(
            <Select
                emptyValue={'Empty'}
                propertyTemplate={propertyTemplate}
                propertyValue={initialOption.id}
                isEditable={true}
                {...selectCallbacks()}
                onCreate={onCreate}
            />,
        ))

        userEvent.click(screen.getByTestId(nonEditableSelectTestId))
        userEvent.type(screen.getByRole('combobox', {name: /value selector/i}), `${newOption}{enter}`)

        expect(onCreate).toHaveBeenCalledWith(newOption)
    })
})
