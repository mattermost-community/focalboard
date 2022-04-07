// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import {IPropertyOption, IPropertyTemplate} from '../../../blocks/board'

import MultiSelect from './multiSelect'

function buildMultiSelectPropertyTemplate(options: IPropertyOption[] = []) : IPropertyTemplate {
    return {
        id: 'multiselect-template-1',
        name: 'Multi',
        options: [
            {
                color: 'propColorDefault',
                id: 'multi-option-1',
                value: 'a',
            },
            {
                color: '',
                id: 'multi-option-2',
                value: 'b',
            },
            {
                color: 'propColorDefault',
                id: 'multi-option-3',
                value: 'c',
            },
            ...options,
        ],
        type: 'multiSelect',
    }
}

type WrapperProps = {
    children?: React.ReactNode;
}

const Wrapper = ({children}: WrapperProps) => {
    return <IntlProvider locale='en'>{children}</IntlProvider>
}

describe('components/properties/multiSelect', () => {
    const nonEditableMultiSelectTestId = 'multiselect-non-editable'

    it('shows only the selected options when menu is not opened', () => {
        const propertyTemplate = buildMultiSelectPropertyTemplate()
        const propertyValue = ['multi-option-1', 'multi-option-2']

        const {container} = render(
            <MultiSelect
                isEditable={false}
                emptyValue={''}
                propertyTemplate={propertyTemplate}
                propertyValue={propertyValue}
                onChange={jest.fn()}
                onChangeColor={jest.fn()}
                onDeleteOption={jest.fn()}
                onCreate={jest.fn()}
                onDeleteValue={jest.fn()}
            />,
            {wrapper: Wrapper},
        )

        const multiSelectParent = screen.getByTestId(nonEditableMultiSelectTestId)

        expect(multiSelectParent.children.length).toBe(propertyValue.length)

        expect(container).toMatchSnapshot()
    })

    it('opens editable multi value selector menu when the button/label is clicked', () => {
        const propertyTemplate = buildMultiSelectPropertyTemplate()

        render(
            <MultiSelect
                isEditable={true}
                emptyValue={''}
                propertyTemplate={propertyTemplate}
                propertyValue={[]}
                onChange={jest.fn()}
                onChangeColor={jest.fn()}
                onDeleteOption={jest.fn()}
                onCreate={jest.fn()}
                onDeleteValue={jest.fn()}
            />,
            {wrapper: Wrapper},
        )

        userEvent.click(screen.getByTestId(nonEditableMultiSelectTestId))

        expect(screen.getByRole('combobox', {name: /value selector/i})).toBeInTheDocument()
    })

    it('can select a option', async () => {
        const propertyTemplate = buildMultiSelectPropertyTemplate()
        const propertyValue = ['multi-option-1']
        const onChange = jest.fn()

        render(
            <MultiSelect
                isEditable={true}
                emptyValue={''}
                propertyTemplate={propertyTemplate}
                propertyValue={propertyValue}
                onChange={onChange}
                onChangeColor={jest.fn()}
                onDeleteOption={jest.fn()}
                onCreate={jest.fn()}
                onDeleteValue={jest.fn()}
            />,
            {wrapper: Wrapper},
        )

        userEvent.click(screen.getByTestId(nonEditableMultiSelectTestId))

        userEvent.type(screen.getByRole('combobox', {name: /value selector/i}), 'b{enter}')

        expect(onChange).toHaveBeenCalledWith(['multi-option-1', 'multi-option-2'])
    })

    it('can unselect a option', async () => {
        const propertyTemplate = buildMultiSelectPropertyTemplate()
        const propertyValue = ['multi-option-1']
        const onDeleteValue = jest.fn()

        render(
            <MultiSelect
                isEditable={true}
                emptyValue={''}
                propertyTemplate={propertyTemplate}
                propertyValue={propertyValue}
                onChange={jest.fn()}
                onChangeColor={jest.fn()}
                onDeleteOption={jest.fn()}
                onCreate={jest.fn()}
                onDeleteValue={onDeleteValue}
            />,
            {wrapper: Wrapper},
        )

        userEvent.click(screen.getByTestId(nonEditableMultiSelectTestId))

        userEvent.click(screen.getAllByRole('button', {name: /clear/i})[0])

        const valueToRemove = propertyTemplate.options.find((option: IPropertyOption) => option.id === propertyValue[0])
        const selectedValues = propertyTemplate.options.filter((option: IPropertyOption) => propertyValue.includes(option.id))

        expect(onDeleteValue).toHaveBeenCalledWith(valueToRemove, selectedValues)
    })

    it('can create a new option', async () => {
        const propertyTemplate = buildMultiSelectPropertyTemplate()
        const propertyValue = ['multi-option-1', 'multi-option-2']
        const onCreate = jest.fn()

        render(
            <MultiSelect
                isEditable={true}
                emptyValue={''}
                propertyTemplate={propertyTemplate}
                propertyValue={propertyValue}
                onChange={jest.fn()}
                onChangeColor={jest.fn()}
                onDeleteOption={jest.fn()}
                onCreate={onCreate}
                onDeleteValue={jest.fn()}
            />,
            {wrapper: Wrapper},
        )

        userEvent.click(screen.getByTestId(nonEditableMultiSelectTestId))

        userEvent.type(screen.getByRole('combobox', {name: /value selector/i}), 'new-value{enter}')

        const selectedValues = propertyTemplate.options.filter((option: IPropertyOption) => propertyValue.includes(option.id))

        expect(onCreate).toHaveBeenCalledWith('new-value', selectedValues)
    })

    it('can delete a option', () => {
        const propertyTemplate = buildMultiSelectPropertyTemplate()
        const propertyValue = ['multi-option-1', 'multi-option-2']

        const onDeleteOption = jest.fn()
        render(
            <MultiSelect
                isEditable={true}
                emptyValue={''}
                propertyTemplate={propertyTemplate}
                propertyValue={propertyValue}
                onChange={jest.fn()}
                onChangeColor={jest.fn()}
                onDeleteOption={onDeleteOption}
                onCreate={jest.fn()}
                onDeleteValue={jest.fn()}
            />,
            {wrapper: Wrapper},
        )

        userEvent.click(screen.getByTestId(nonEditableMultiSelectTestId))

        userEvent.click(screen.getAllByRole('button', {name: /open menu/i})[0])

        userEvent.click(screen.getByRole('button', {name: /delete/i}))

        const optionToDelete = propertyTemplate.options.find((option: IPropertyOption) => option.id === propertyValue[0])

        expect(onDeleteOption).toHaveBeenCalledWith(optionToDelete)
    })

    it('can change color for any option', () => {
        const propertyTemplate = buildMultiSelectPropertyTemplate()
        const propertyValue = ['multi-option-1', 'multi-option-2']
        const newColorKey = 'propColorYellow'
        const newColorValue = 'yellow'

        const onChangeColor = jest.fn()
        render(
            <MultiSelect
                isEditable={true}
                emptyValue={''}
                propertyTemplate={propertyTemplate}
                propertyValue={propertyValue}
                onChange={jest.fn()}
                onChangeColor={onChangeColor}
                onDeleteOption={jest.fn()}
                onCreate={jest.fn()}
                onDeleteValue={jest.fn()}
            />,
            {wrapper: Wrapper},
        )

        userEvent.click(screen.getByTestId(nonEditableMultiSelectTestId))

        userEvent.click(screen.getAllByRole('button', {name: /open menu/i})[0])

        userEvent.click(screen.getByRole('button', {name: new RegExp(newColorValue, 'i')}))

        const selectedOption = propertyTemplate.options.find((option: IPropertyOption) => option.id === propertyValue[0])

        expect(onChangeColor).toHaveBeenCalledWith(selectedOption, newColorKey)
    })
})
