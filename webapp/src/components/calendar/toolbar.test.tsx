// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import '@testing-library/jest-dom'

import {wrapIntl} from '../../testUtils'

import CustomToolbar from './toolbar'

describe('components/calendar/toolbar', () => {
    const mockNavigate = jest.fn()
    const mockView = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    const localizer = {
        messages: {
            month: 'month',
            week: 'week',
            today: 'today',
        },
    }

    test('return toolbar', () => {
        const {container} = render(
            wrapIntl(
                <CustomToolbar
                    date={new Date()}
                    view='month'
                    views={['week', 'month']}
                    label='September 2021'
                    localizer={localizer}
                    onNavigate={mockNavigate}
                    onView={mockView}
                />,
            ),
        )
        expect(container).toMatchSnapshot()
    })

    test('return toolbar, no views', () => {
        const {container} = render(
            wrapIntl(
                <CustomToolbar
                    date={new Date()}
                    view='month'
                    views={[]}
                    label='September 2021'
                    localizer={localizer}
                    onNavigate={mockNavigate}
                    onView={mockView}
                />,
            ),
        )
        expect(container).toMatchSnapshot()
    })

    test('toolbar test navigate', () => {
        const {container} = render(
            wrapIntl(
                <CustomToolbar
                    date={new Date()}
                    view='month'
                    views={['week', 'month']}
                    label='September 2021'
                    localizer={localizer}
                    onNavigate={mockNavigate}
                    onView={mockView}
                />,
            ),
        )
        expect(container).toMatchSnapshot()
        const buttonPrev = screen.getByRole('button', {name: '<'})
        userEvent.click(buttonPrev)
        const buttonNext = screen.getByRole('button', {name: '>'})
        userEvent.click(buttonNext)
        const buttonToday = screen.getByRole('button', {name: localizer.messages.today})
        userEvent.click(buttonToday)

        expect(mockView).not.toBeCalled()
        expect(mockNavigate).toBeCalledTimes(3)
    })

    test('toolbar test view', () => {
        const {container} = render(
            wrapIntl(
                <CustomToolbar
                    date={new Date()}
                    view='month'
                    views={['week', 'month']}
                    label='September 2021'
                    localizer={localizer}
                    onNavigate={mockNavigate}
                    onView={mockView}
                />,
            ),
        )
        expect(container).toMatchSnapshot()
        const buttonMonth = screen.getByRole('button', {name: localizer.messages.month})
        userEvent.click(buttonMonth)

        const buttonWeek = screen.getByRole('button', {name: localizer.messages.week})
        userEvent.click(buttonWeek)

        expect(mockNavigate).not.toBeCalled()
        expect(mockView).toBeCalledTimes(2)
    })
})
