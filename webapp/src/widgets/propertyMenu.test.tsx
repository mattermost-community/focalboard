// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import PropertyMenu from './propertyMenu'

describe('widgets/PropertyMenu', () => {
    beforeEach(() => {
        // Quick fix to disregard console error when unmounting a component
        console.error = jest.fn()
        document.execCommand = jest.fn()
    })

    test('should display the type of property', () => {
        const callback = jest.fn()

        const {getByText} = render(
            <IntlProvider locale='en'>
                <PropertyMenu
                    propertyId={'id'}
                    propertyName={'email of a person'}
                    propertyType={'email'}
                    onTypeChanged={callback}
                    onNameChanged={callback}
                    onDelete={callback}
                />
            </IntlProvider>,
        )

        expect(getByText('Type: Email')).toBeVisible()
    })

    test('handles delete event', () => {
        const callback = jest.fn()

        render(
            <IntlProvider locale='en'>
                <PropertyMenu
                    propertyId={'id'}
                    propertyName={'email of a person'}
                    propertyType={'email'}
                    onTypeChanged={callback}
                    onNameChanged={callback}
                    onDelete={callback}
                />
            </IntlProvider>,
        )
        fireEvent.click(screen.getByText(/delete/i))
        expect(callback).toHaveBeenCalledWith('id')
    })

    test('handles name change event', () => {
        const callback = jest.fn()

        render(
            <IntlProvider locale='en'>
                <PropertyMenu
                    propertyId={'id'}
                    propertyName={'test-property'}
                    propertyType={'text'}
                    onTypeChanged={callback}
                    onNameChanged={callback}
                    onDelete={callback}
                />
            </IntlProvider>,
        )
        const input = screen.getByDisplayValue(/test-property/i)
        fireEvent.change(input, {target: {value: 'changed name'}})
        fireEvent.blur(input)
        expect(callback).toHaveBeenCalledWith('changed name')
    })

    test('handles type change event', () => {
        const callback = jest.fn()

        render(
            <IntlProvider locale='en'>
                <PropertyMenu
                    propertyId={'id'}
                    propertyName={'test-property'}
                    propertyType={'text'}
                    onTypeChanged={callback}
                    onNameChanged={callback}
                    onDelete={callback}
                />
            </IntlProvider>,
        )
        const menuOpen = screen.getByText(/Type: Text/i)
        fireEvent.click(menuOpen)
        fireEvent.click(screen.getByText('Select'))
        expect(callback).toHaveBeenCalledWith('select')
    })
})
