// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render, screen} from '@testing-library/react'
import {Provider as ReduxProvider} from 'react-redux'

import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'

import {mocked} from 'jest-mock'

import {FilterClause} from '../../blocks/filterClause'

import {TestBlockFactory} from '../../test/testBlockFactory'

import {wrapIntl, mockStateStore} from '../../testUtils'

import mutator from '../../mutator'

import FilterEntry from './filterEntry'

jest.mock('../../mutator')
const mockedMutator = mocked(mutator, true)

const board = TestBlockFactory.createBoard()
const activeView = TestBlockFactory.createBoardView(board)
const filter: FilterClause = {
    propertyId: '1',
    condition: 'includes',
    values: ['Status'],
}
const state = {
    users: {
        me: {
            id: 'user-id-1',
            username: 'username_1',
        },
    },
}
const store = mockStateStore([], state)
const mockedConditionClicked = jest.fn()

describe('components/viewHeader/filterEntry', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        board.cardProperties[0].options = [{id: 'Status', value: 'Status', color: ''}]
        activeView.fields.filter.filters = [filter]
    })
    test('return filterEntry', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <FilterEntry
                        board={board}
                        view={activeView}
                        conditionClicked={mockedConditionClicked}
                        filter={filter}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getAllByRole('button', {name: 'menuwrapper'})[0]
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
    })

    test('return filterEntry and click on status', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <FilterEntry
                        board={board}
                        view={activeView}
                        conditionClicked={mockedConditionClicked}
                        filter={filter}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getAllByRole('button', {name: 'menuwrapper'})[0]
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
        const buttonStatus = screen.getByRole('button', {name: 'Status'})
        userEvent.click(buttonStatus)
        expect(mockedMutator.changeViewFilter).toBeCalledTimes(1)
    })
    test('return filterEntry and click on includes', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <FilterEntry
                        board={board}
                        view={activeView}
                        conditionClicked={mockedConditionClicked}
                        filter={filter}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getAllByRole('button', {name: 'menuwrapper'})[1]
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
        const buttonIncludes = screen.getAllByRole('button', {name: 'includes'})[1]
        userEvent.click(buttonIncludes)
        expect(mockedConditionClicked).toBeCalledTimes(1)
    })
    test('return filterEntry and click on doesn\'t include', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <FilterEntry
                        board={board}
                        view={activeView}
                        conditionClicked={mockedConditionClicked}
                        filter={filter}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getAllByRole('button', {name: 'menuwrapper'})[1]
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
        const buttonNotInclude = screen.getByRole('button', {name: 'doesn\'t include'})
        userEvent.click(buttonNotInclude)
        expect(mockedConditionClicked).toBeCalledTimes(1)
    })
    test('return filterEntry and click on is empty', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <FilterEntry
                        board={board}
                        view={activeView}
                        conditionClicked={mockedConditionClicked}
                        filter={filter}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getAllByRole('button', {name: 'menuwrapper'})[1]
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
        const buttonEmpty = screen.getByRole('button', {name: 'is empty'})
        userEvent.click(buttonEmpty)
        expect(mockedConditionClicked).toBeCalledTimes(1)
    })
    test('return filterEntry and click on is not empty', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <FilterEntry
                        board={board}
                        view={activeView}
                        conditionClicked={mockedConditionClicked}
                        filter={filter}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getAllByRole('button', {name: 'menuwrapper'})[1]
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
        const buttonNotEmpty = screen.getByRole('button', {name: 'is not empty'})
        userEvent.click(buttonNotEmpty)
        expect(mockedConditionClicked).toBeCalledTimes(1)
    })
    test('return filterEntry and click on delete', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <FilterEntry
                        board={board}
                        view={activeView}
                        conditionClicked={mockedConditionClicked}
                        filter={filter}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getAllByRole('button', {name: 'menuwrapper'})[1]
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
        const allButton = screen.getAllByRole('button')
        userEvent.click(allButton[allButton.length - 1])
        expect(mockedMutator.changeViewFilter).toBeCalledTimes(1)
    })
})
