// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {fireEvent, render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {act} from 'react-dom/test-utils'

import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import EditableDayPicker from './editableDayPicker'

const wrapIntl = (children: any) => <IntlProvider locale='en'>{children}</IntlProvider>

describe('widgets/EditableDayPicker', () => {
    beforeEach(() => {
        // Quick fix to disregard console error when unmounting a component
        console.error = jest.fn()
        document.execCommand = jest.fn()
    })

    test('returns default correctly', () => {
        // const callback = jest.fn()
        const component = wrapIntl(
            <EditableDayPicker
                className='octo-propertyvalue'
                value={''}
                onChange={jest.fn()}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('handles calendar click event', () => {
        const callback = jest.fn()
        const component = wrapIntl(
            <EditableDayPicker
                className='octo-propertyvalue'
                value={''}
                onChange={callback}
            />,
        )

        const date = new Date()
        const fifteenth = new Date(date.getFullYear(), date.getMonth(), 15)
        fifteenth.setHours(12)

        const {getByText, getByTitle} = render(component)
        const dayDisplay = getByText('Empty')
        act(() => {
            userEvent.click(dayDisplay)
        })

        const day = getByText('15')
        const modal = getByTitle('Close').children[0]
        act(() => {
            userEvent.click(day)
        })
        act(() => {
            userEvent.click(modal)
        })

        expect(callback).toHaveBeenCalledWith(fifteenth.getTime().toString())
    })

    test('handles setting range', () => {
        const callback = jest.fn()
        const component = wrapIntl(
            <EditableDayPicker
                className='octo-propertyvalue'
                value={''}
                onChange={callback}
            />,
        )

        // open modal
        const {getByText, getByTitle} = render(component)
        const dayDisplay = getByText('Empty')
        act(() => {
            userEvent.click(dayDisplay)
        })

        // select start date
        const date = new Date()
        const fifteenth = new Date(date.getFullYear(), date.getMonth(), 15)
        fifteenth.setHours(12)
        const start = getByText('15')
        act(() => {
            userEvent.click(start)
        })

        // create range
        const endDate = getByText('End date')
        act(() => {
            userEvent.click(endDate)
        })

        const twentieth = new Date(date.getFullYear(), date.getMonth(), 20)
        twentieth.setHours(12)

        const end = getByText('20')
        const modal = getByTitle('Close').children[0]
        act(() => {
            userEvent.click(end)
        })
        act(() => {
            userEvent.click(modal)
        })

        expect(callback).toHaveBeenCalledWith([fifteenth.getTime().toString(), twentieth.getTime().toString()])
    })

    test('handle clear', () => {
        const callback = jest.fn()
        const component = wrapIntl(
            <EditableDayPicker
                className='octo-propertyvalue'
                value={'1623780000000'}
                onChange={callback}
            />,
        )

        const {container, getByText, getByTitle} = render(component)
        expect(container).toMatchSnapshot()

        // open modal
        const dayDisplay = getByText('Jun 15, 2021')
        act(() => {
            userEvent.click(dayDisplay)
        })

        const clear = getByText('Clear')
        const modal = getByTitle('Close').children[0]
        act(() => {
            userEvent.click(clear)
        })
        act(() => {
            userEvent.click(modal)
        })

        expect(callback).toHaveBeenCalledWith('')
    })

    test('set via text input', () => {
        const callback = jest.fn()
        const component = wrapIntl(
            <EditableDayPicker
                className='octo-propertyvalue'
                value={['1623780000000', '1624212000000']}
                onChange={callback}
            />,
        )

        const {container, getByText, getByTitle, getByDisplayValue} = render(component)
        expect(container).toMatchSnapshot()

        // open modal
        const dayDisplay = getByText('Jun 15, 2021 -> Jun 20, 2021')
        act(() => {
            userEvent.click(dayDisplay)
        })

        const fromInput = getByDisplayValue('Jun 15, 2021')
        const toInput = getByDisplayValue('Jun 20, 2021')

        act(() => {
            userEvent.type(fromInput, 'Jul 15, 2021{enter}')
        })
        act(() => {
            userEvent.type(toInput, 'Jul 20, 2021{enter}')
        })

        const modal = getByTitle('Close').children[0]
        act(() => {
            userEvent.click(modal)
        })

        expect(callback).toHaveBeenCalledWith(['1623736800000', '1624168800000'])
    })

    test('cancel set via text input', () => {
        const callback = jest.fn()
        const component = wrapIntl(
            <EditableDayPicker
                className='octo-propertyvalue'
                value={['1623780000000', '1624212000000']}
                onChange={callback}
            />,
        )

        const {container, getByText, getByTitle, getByDisplayValue} = render(component)
        expect(container).toMatchSnapshot()

        // open modal
        const dayDisplay = getByText('Jun 15, 2021 -> Jun 20, 2021')
        act(() => {
            userEvent.click(dayDisplay)
        })

        const fromInput = getByDisplayValue('Jun 15, 2021')
        const toInput = getByDisplayValue('Jun 20, 2021')

        act(() => {
            userEvent.type(fromInput, 'Jul 15, 2021{esc}')
        })
        act(() => {
            userEvent.type(toInput, 'Jul 20, 2021{esc}')
        })

        const modal = getByTitle('Close').children[0]
        act(() => {
            userEvent.click(modal)
        })

        expect(callback).toHaveBeenCalledWith(['1623780000000', '1624212000000'])
    })
})
