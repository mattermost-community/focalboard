// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'
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
        const fifteenth = Date.UTC(date.getFullYear(), date.getMonth(), 15, 12)

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

        const rObject = {from: fifteenth}
        expect(callback).toHaveBeenCalledWith(JSON.stringify(rObject))
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
        const fifteenth = Date.UTC(date.getFullYear(), date.getMonth(), 15, 12)
        const start = getByText('15')
        act(() => {
            userEvent.click(start)
        })

        // create range
        const endDate = getByText('End date')
        act(() => {
            userEvent.click(endDate)
        })

        const twentieth = Date.UTC(date.getFullYear(), date.getMonth(), 20, 12)

        const end = getByText('20')
        const modal = getByTitle('Close').children[0]
        act(() => {
            userEvent.click(end)
        })
        act(() => {
            userEvent.click(modal)
        })

        const rObject = {from: fifteenth, to: twentieth}
        expect(callback).toHaveBeenCalledWith(JSON.stringify(rObject))
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
                value={'{"from":1623715200000,"to":1624147200000}'}
                onChange={callback}
            />,
        )

        const {container, getByText, getByTitle, getByDisplayValue} = render(component)
        expect(container).toMatchSnapshot()

        // open modal
        const dayDisplay = getByText('Jun 15, 2021 -> Jun 20, 2021')

        userEvent.click(dayDisplay)

        const fromInput = getByDisplayValue('Jun 15, 2021')
        const toInput = getByDisplayValue('Jun 20, 2021')

        userEvent.type(fromInput, '{selectall}Jul 15, 2021{enter}')
        userEvent.type(toInput, '{selectall}Jul 20, 2021{enter}')

        const modal = getByTitle('Close').children[0]

        userEvent.click(modal)

        // {from: '2021-07-15', to: '2021-07-20'}
        const retVal = '{"from":1626307200000,"to":1626739200000}'
        expect(callback).toHaveBeenCalledWith(retVal)
    })

    test('cancel set via text input', () => {
        const callback = jest.fn()
        const component = wrapIntl(
            <EditableDayPicker
                className='octo-propertyvalue'
                value={'{"from":1623715200000,"to":1624147200000}'}
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
            userEvent.type(fromInput, 'Jul 15, 2021{delay}{esc}')
        })
        act(() => {
            userEvent.type(toInput, 'Jul 20, 2021{delay}{esc}')
        })

        const modal = getByTitle('Close').children[0]
        act(() => {
            userEvent.click(modal)
        })

        // const retVal = {from: '2021-06-15', to: '2021-06-20'}
        const retVal = '{"from":1623715200000,"to":1624147200000}'

        expect(callback).toHaveBeenCalledWith(retVal)
    })
})
