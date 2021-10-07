// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render, screen} from '@testing-library/react'
import {Provider as ReduxProvider} from 'react-redux'

import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'

import {mocked} from 'ts-jest/utils'

import {TestBlockFactory} from '../../test/testBlockFactory'

import {wrapIntl, mockStateStore} from '../../testUtils'

import {Archiver} from '../../archiver'

import {CsvExporter} from '../../csvExporter'

import ViewHeaderActionsMenu from './viewHeaderActionsMenu'

jest.mock('../../archiver')
jest.mock('../../csvExporter')
const mockedArchiver = mocked(Archiver, true)
const mockedCsvExporter = mocked(CsvExporter, true)

const board = TestBlockFactory.createBoard()
const activeView = TestBlockFactory.createBoardView(board)
const card = TestBlockFactory.createCard(board)

describe('components/viewHeader/viewHeaderActionsMenu', () => {
    const state = {
        users: {
            me: {
                id: 'user-id-1',
                username: 'username_1',
            },
        },
    }
    const store = mockStateStore([], state)
    beforeEach(() => {
        jest.clearAllMocks()
    })
    test('return menu with Share Boards', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderActionsMenu
                        board={board}
                        activeView={activeView}
                        cards={[card]}
                        showShared={true}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getByRole('button', {
            name: 'menuwrapper',
        })
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
    })

    test('return menu without Share Boards', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderActionsMenu
                        board={board}
                        activeView={activeView}
                        cards={[card]}
                        showShared={false}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getByRole('button', {
            name: 'menuwrapper',
        })
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
    })
    test('return menu and verify call to csv exporter', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderActionsMenu
                        board={board}
                        activeView={activeView}
                        cards={[card]}
                        showShared={true}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getByRole('button', {name: 'menuwrapper'})
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
        const buttonExportCSV = screen.getByRole('button', {name: 'Export to CSV'})
        userEvent.click(buttonExportCSV)
        expect(mockedCsvExporter.exportTableCsv).toBeCalledTimes(1)
    })

    test('return menu and verify call to board archive', () => {
        const {container} = render(
            wrapIntl(
                <ReduxProvider store={store}>
                    <ViewHeaderActionsMenu
                        board={board}
                        activeView={activeView}
                        cards={[card]}
                        showShared={true}
                    />
                </ReduxProvider>,
            ),
        )
        const buttonElement = screen.getByRole('button', {name: 'menuwrapper'})
        userEvent.click(buttonElement)
        expect(container).toMatchSnapshot()
        const buttonExportBoardArchive = screen.getByRole('button', {name: 'Export board archive'})
        userEvent.click(buttonExportBoardArchive)
        expect(mockedArchiver.exportBoardArchive).toBeCalledTimes(1)
        expect(mockedArchiver.exportBoardArchive).toBeCalledWith(board)
    })
})
