// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactElement, ReactNode} from 'react'
import {render, screen} from '@testing-library/react'

import '@testing-library/jest-dom'

import userEvent from '@testing-library/user-event'

import {act} from 'react-dom/test-utils'

import {TestBlockFactory} from '../test/testBlockFactory'

import {wrapIntl} from '../testUtils'

import AddContentMenuItem from './addContentMenuItem'

import './content/textElement'
import './content/imageElement'
import './content/dividerElement'
import './content/checkboxElement'
import {CardDetailProvider} from './cardDetail/cardDetailContext'

const board = TestBlockFactory.createBoard()
const card = TestBlockFactory.createCard(board)
const wrap = (child: ReactNode): ReactElement => (
    wrapIntl(
        <CardDetailProvider card={card} >
            {child}
        </CardDetailProvider>,
    )
)

jest.mock('../mutator')

describe('components/addContentMenuItem', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })
    test('return an image menu item', () => {
        const {container} = render(
            wrap(
                <AddContentMenuItem
                    type={'image'}
                    cords={{x: 0}}
                />,
            ),
        )
        expect(container).toMatchSnapshot()
    })

    test('return a text menu item', async () => {
        const {container} = render(
            wrap(
                <AddContentMenuItem
                    type={'text'}
                    cords={{x: 0}}
                />,
            ),
        )
        expect(container).toMatchSnapshot()
        await act(async () => {
            const buttonElement = screen.getByRole('button', {name: 'text'})
            userEvent.click(buttonElement)
        })
        expect(container).toMatchSnapshot()
    })

    test('return a checkbox menu item', async () => {
        const {container} = render(
            wrap(
                <AddContentMenuItem
                    type={'checkbox'}
                    cords={{x: 0}}
                />,
            ),
        )
        expect(container).toMatchSnapshot()
        await act(async () => {
            const buttonElement = screen.getByRole('button', {name: 'checkbox'})
            userEvent.click(buttonElement)
        })
        expect(container).toMatchSnapshot()
    })

    test('return a divider menu item', async () => {
        const {container} = render(
            wrap(
                <AddContentMenuItem
                    type={'divider'}
                    cords={{x: 0}}
                />,
            ),
        )
        expect(container).toMatchSnapshot()
        await act(async () => {
            const buttonElement = screen.getByRole('button', {name: 'divider'})
            userEvent.click(buttonElement)
        })
        expect(container).toMatchSnapshot()
    })

    test('return an error and empty element from unknown type', () => {
        const {container} = render(
            wrap(
                <AddContentMenuItem
                    type={'unknown'}
                    cords={{x: 0}}
                />,
            ),
        )
        expect(container).toMatchSnapshot()
    })
})
