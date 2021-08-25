// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import DateRange from '../dateRange/dateRange'

const wrapIntl = (children: any) => <IntlProvider locale='en'>{children}</IntlProvider>

// create Dates for specific days for this year.
const June15 = new Date(Date.UTC(new Date().getFullYear(), 5, 15, 12))
const June15Local = new Date(new Date().getFullYear(), 5, 15, 12)
const June20 = new Date(Date.UTC(new Date().getFullYear(), 5, 20, 12))

describe('components/properties/dateRange', () => {
    beforeEach(() => {
        // Quick fix to disregard console error when unmounting a component
        console.error = jest.fn()
        document.execCommand = jest.fn()
    })

    test('returns default correctly', () => {
        const component = wrapIntl(
            <DateRange
                className='octo-propertyvalue'
                value={''}
                onChange={jest.fn()}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('returns local correctly - es local', () => {
        const component = (
            <IntlProvider locale='es'>
                <DateRange
                    className='octo-propertyvalue'
                    value={June15Local.getTime().toString()}
                    onChange={jest.fn()}
                />
            </IntlProvider>
        )

        const {container, getByText} = render(component)
        const input = getByText('15 de junio')
        expect(input).not.toBeNull()
        expect(container).toMatchSnapshot()
    })

    test('handles calendar click event', () => {
        const callback = jest.fn()
        const component = wrapIntl(
            <DateRange
                className='octo-propertyvalue'
                value={''}
                onChange={callback}
            />,
        )

        const date = new Date()
        const fifteenth = Date.UTC(date.getFullYear(), date.getMonth(), 15, 12)

        const {getByText, getByTitle} = render(component)
        const dayDisplay = getByTitle('Empty')
        userEvent.click(dayDisplay)

        const day = getByText('15')
        const modal = getByTitle('Close').children[0]
        userEvent.click(day)
        userEvent.click(modal)

        const rObject = {from: fifteenth}
        expect(callback).toHaveBeenCalledWith(JSON.stringify(rObject))
    })

    test('handles setting range', () => {
        const callback = jest.fn()
        const component = wrapIntl(
            <DateRange
                className='octo-propertyvalue'
                value={''}
                onChange={callback}
            />,
        )

        // open modal
        const {getByText, getByTitle} = render(component)
        const dayDisplay = getByTitle('Empty')
        userEvent.click(dayDisplay)

        // select start date
        const date = new Date()
        const fifteenth = Date.UTC(date.getFullYear(), date.getMonth(), 15, 12)
        const start = getByText('15')
        userEvent.click(start)

        // create range
        const endDate = getByText('End date')
        userEvent.click(endDate)

        const twentieth = Date.UTC(date.getFullYear(), date.getMonth(), 20, 12)

        const end = getByText('20')
        const modal = getByTitle('Close').children[0]
        userEvent.click(end)
        userEvent.click(modal)

        const rObject = {from: fifteenth, to: twentieth}
        expect(callback).toHaveBeenCalledWith(JSON.stringify(rObject))
    })

    test('handle clear', () => {
        const callback = jest.fn()
        const component = wrapIntl(
            <DateRange
                className='octo-propertyvalue'
                value={June15Local.getTime().toString()}
                onChange={callback}
            />,
        )

        const {container, getByText, getByTitle} = render(component)
        expect(container).toMatchSnapshot()

        // open modal
        const dayDisplay = getByText('June 15')
        userEvent.click(dayDisplay)

        const clear = getByText('Clear')
        const modal = getByTitle('Close').children[0]
        userEvent.click(clear)
        userEvent.click(modal)

        expect(callback).toHaveBeenCalledWith('')
    })

    test('set via text input', () => {
        const callback = jest.fn()
        const component = wrapIntl(
            <DateRange
                className='octo-propertyvalue'
                value={'{"from": ' + June15.getTime().toString() + ',"to": ' + June20.getTime().toString() + '}'}
                onChange={callback}
            />,
        )

        const {container, getByRole, getByTitle, getByDisplayValue} = render(component)
        expect(container).toMatchSnapshot()

        // open modal
        const dayDisplay = getByRole('button', {name: 'June 15 → June 20'})

        userEvent.click(dayDisplay)

        const fromInput = getByDisplayValue('June 15')
        const toInput = getByDisplayValue('June 20')

        userEvent.type(fromInput, '{selectall}{delay}07/15/2021{enter}')
        userEvent.type(toInput, '{selectall}{delay}07/20/2021{enter}')

        const July15 = new Date(Date.UTC(2021, 6, 15, 12))
        const July20 = new Date(Date.UTC(2021, 6, 20, 12))
        const modal = getByTitle('Close').children[0]

        userEvent.click(modal)

        // {from: '2021-07-15', to: '2021-07-20'}
        const retVal = '{"from":' + July15.getTime().toString() + ',"to":' + July20.getTime().toString() + '}'
        expect(callback).toHaveBeenCalledWith(retVal)
    })

    test('set via text input, es locale', () => {
        const callback = jest.fn()

        const component = (
            <IntlProvider locale='es'>
                <DateRange
                    className='octo-propertyvalue'
                    value={'{"from": ' + June15.getTime().toString() + ',"to": ' + June20.getTime().toString() + '}'}
                    onChange={callback}
                />
            </IntlProvider>
        )
        const {container, getByRole, getByTitle, getByDisplayValue} = render(component)
        expect(container).toMatchSnapshot()

        // open modal
        const dayDisplay = getByRole('button', {name: '15 de junio → 20 de junio'})

        userEvent.click(dayDisplay)

        const fromInput = getByDisplayValue('15 de junio')
        const toInput = getByDisplayValue('20 de junio')

        userEvent.type(fromInput, '{selectall}15/07/2021{enter}')
        userEvent.type(toInput, '{selectall}20/07/2021{enter}')

        const July15 = new Date(Date.UTC(2021, 6, 15, 12))
        const July20 = new Date(Date.UTC(2021, 6, 20, 12))
        const modal = getByTitle('Close').children[0]

        userEvent.click(modal)

        // {from: '2021-07-15', to: '2021-07-20'}
        const retVal = '{"from":' + July15.getTime().toString() + ',"to":' + July20.getTime().toString() + '}'
        expect(callback).toHaveBeenCalledWith(retVal)
    })

    test('cancel set via text input', () => {
        const callback = jest.fn()
        const component = wrapIntl(
            <DateRange
                className='octo-propertyvalue'
                value={'{"from": ' + June15.getTime().toString() + ',"to": ' + June20.getTime().toString() + '}'}
                onChange={callback}
            />,
        )

        const {container, getByRole, getByTitle, getByDisplayValue} = render(component)
        expect(container).toMatchSnapshot()

        // open modal
        const dayDisplay = getByRole('button', {name: 'June 15 → June 20'})
        userEvent.click(dayDisplay)

        const fromInput = getByDisplayValue('June 15')
        const toInput = getByDisplayValue('June 20')
        userEvent.type(fromInput, '{selectall}07/15/2021{delay}{esc}')
        userEvent.type(toInput, '{selectall}07/20/2021{delay}{esc}')

        const modal = getByTitle('Close').children[0]
        userEvent.click(modal)

        // const retVal = {from: '2021-06-15', to: '2021-06-20'}
        const retVal = '{"from":' + June15.getTime().toString() + ',"to":' + June20.getTime().toString() + '}'
        expect(callback).toHaveBeenCalledWith(retVal)
    })
})
