// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {render, screen} from '@testing-library/react'
import {Provider as ReduxProvider} from 'react-redux'

import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import {mocked} from 'ts-jest/utils'

import {TestBlockFactory} from '../../test/testBlockFactory'

import mutator from '../../mutator'

import {wrapIntl, mockStateStore} from '../../testUtils'

import ViewHeaderGroupByMenu from './viewHeaderGroupByMenu'

jest.mock('../../mutator')
const mockedMutator = mocked(mutator, true)

const board = TestBlockFactory.createBoard()
const activeView = TestBlockFactory.createBoardView(board)
const property = board.fields.cardProperties.find((p) => p.name === 'Status')

describe('components/viewHeader/viewHeaderGroupByMenu', () => {
    const state = {
        users: {
            me: {
                id: 'user-id-1',
                username: 'username_1'},
        },
    }
    const store = mockStateStore([], state)
    beforeEach(() => {
        jest.clearAllMocks()
    })
    test('return groupBy menu', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderGroupByMenu
                        activeView={activeView}
                        groupByProperty={property}
                        properties={board.fields.cardProperties}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getByRole('button', {name: 'menuwrapper'})
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
    })
    test('return groupBy menu and groupBy Status', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderGroupByMenu
                        activeView={activeView}
                        groupByProperty={property}
                        properties={board.fields.cardProperties}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getByRole('button', {name: 'menuwrapper'})
        userEvent.click(buttonElement)
        const buttonStatus = screen.getByRole('button', {name: 'Status'})
        userEvent.click(buttonStatus)
        expect(container).toMatchSnapshot()
        expect(mockedMutator.changeViewGroupById).toBeCalledTimes(1)
    })
    test('return groupBy menu and ungroup in viewType table', () => {
        activeView.fields.viewType = 'table'
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderGroupByMenu
                        activeView={activeView}
                        groupByProperty={property}
                        properties={board.fields.cardProperties}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getByRole('button', {name: 'menuwrapper'})
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
        const buttonStatus = screen.getByRole('button', {name: 'Ungroup'})
        userEvent.click(buttonStatus)
        expect(mockedMutator.changeViewGroupById).toBeCalledTimes(1)
    })
})
