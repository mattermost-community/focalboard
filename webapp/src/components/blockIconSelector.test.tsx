// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactElement} from 'react'
import {fireEvent, render, screen} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {TestBlockFactory} from '../test/testBlockFactory'

import BlockIconSelector from './blockIconSelector'

const wrapIntl = (children: ReactElement) => <IntlProvider locale='en'>{children}</IntlProvider>
const board = TestBlockFactory.createBoard()
const icon = BlockIcons.shared.randomIcon()

jest.mock('../mutator', () => ({
    changeIcon: jest.fn((id, oldIcon, newIcon) => {
        board.fields.icon = newIcon
        return Promise.resolve()
    }),
}))

describe('components/blockIconSelector', () => {
    beforeEach(() => {
        board.fields.icon = icon
    })
    test('return an icon correctly', () => {
        render(wrapIntl(
            <BlockIconSelector
                block={board}
                size='l'
            />,
        ))
        expect(screen.queryByText(icon)).toBeTruthy()
    })
    test('return no element with no icon', () => {
        board.fields.icon = ''
        const {container} = render(wrapIntl(
            <BlockIconSelector
                block={board}
                size='l'
            />,
        ))
        expect(container).toBeEmptyDOMElement()
    })
    test('return menu on click', () => {
        const {container} = render(wrapIntl(
            <BlockIconSelector
                block={board}
                size='l'
            />,
        ))
        userEvent.click(container.getElementsByTagName('div')[1]) //0 is div "BlockIconSelector"
        expect(screen.queryByRole('button', {name: 'Random'})).not.toBeNull()
        expect(screen.queryByText('Pick icon')).not.toBeNull()
        expect(screen.queryByRole('button', {name: 'Remove icon'})).not.toBeNull()
    })
    test('return no menu in readonly', () => {
        const {container} = render(wrapIntl(
            <BlockIconSelector
                block={board}
                readonly={true}
            />,
        ))
        expect(container.getElementsByTagName('div')[1].className).toContain('readonly')
        expect(container.getElementsByClassName('MenuWrapper').length).toEqual(0)
    })

    test('return a new icon after click on random menu', () => {
        const {container} = render(wrapIntl(
            <BlockIconSelector
                block={board}
                size='l'
            />,
        ))
        userEvent.click(container.getElementsByTagName('div')[1]) //0 is div "BlockIconSelector"
        const buttonRandom = screen.queryByRole('button', {name: 'Random'})
        expect(buttonRandom).not.toBeNull()
        userEvent.click(buttonRandom!)
        expect(board.fields.icon).not.toBeNull()
        expect(board.fields.icon).not.toEqual(icon)
    })

    test('return a new icon after click on EmojiPicker', async () => {
        const {container} = render(wrapIntl(
            <BlockIconSelector
                block={board}
                size='l'
            />,
        ))
        userEvent.click(container.getElementsByTagName('div')[1]) //0 is div "BlockIconSelector"
        const menuPicker = container.querySelector('div#pick')
        expect(menuPicker).not.toBeNull()
        fireEvent.mouseEnter(menuPicker!)

        const allButtonThumbUp = await screen.findAllByRole('button', {name: /thumbsup/i})
        userEvent.click(allButtonThumbUp[0])

        expect(board.fields.icon).not.toBeNull()
        expect(board.fields.icon).toEqual('👍')
    })

    test('return no icon after click on remove menu', () => {
        const {container, rerender} = render(wrapIntl(
            <BlockIconSelector
                block={board}
                size='l'
            />,
        ))
        userEvent.click(container.getElementsByTagName('div')[1]) //0 is div "BlockIconSelector"
        const buttonRemove = screen.queryByRole('button', {name: 'Remove icon'})
        expect(buttonRemove).not.toBeNull()
        userEvent.click(buttonRemove!)
        expect(board.fields.icon).not.toBeNull()
        expect(board.fields.icon).toEqual('')

        rerender(wrapIntl(
            <BlockIconSelector
                block={board}
            />),
        )
        expect(container).toBeEmptyDOMElement()
    })
})
