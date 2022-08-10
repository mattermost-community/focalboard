// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {MockStoreEnhanced} from "redux-mock-store"
import {mocked} from 'jest-mock'

import {Provider as ReduxProvider} from 'react-redux'

import {render, screen, act} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {createMemoryHistory, History} from "history"

import {Router} from "react-router-dom"

import octoClient from '../../octoClient'

import {Team} from "../../store/teams"
import {TestBlockFactory} from "../../test/testBlockFactory"

import {mockStateStore, wrapDNDIntl} from "../../testUtils"

import {Board, createBoard} from '../../../../webapp/src/blocks/board'

import {Utils} from '../../../../webapp/src/utils'

import BoardSwitcherDialog from "./boardSwitcherDialog"

jest.mock('../../octoClient')
const mockedOctoClient = mocked(octoClient, true)
jest.mock('../../../../webapp/src/utils')
const mockedUtils = mocked(Utils, true)

const wait = (ms: number) => {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })
}

describe('component/BoardSwitcherDialog', () => {
    const team1: Team = {
        id: 'team-id-1',
        title: 'Dunder Mifflin',
        signupToken: '',
        updateAt: 0,
        modifiedBy: 'michael-scott',
    }

    const team2: Team = {
        id: 'team-id-2',
        title: 'Michael Scott Paper Company',
        signupToken: '',
        updateAt: 0,
        modifiedBy: 'michael-scott',
    }

    const me = TestBlockFactory.createUser()

    const state = {
        users: {
            me: me,
        },
        teams: {
            allTeams: [team1, team2],
            current: team1,
        },
        sidebar: {
            categoryAttributes: [],
        }
    }

    let store:MockStoreEnhanced<unknown, unknown>
    let history: History


    beforeEach(() => {
        store = mockStateStore([], state)
        history = createMemoryHistory()
    })


    test('base case', () => {
        const onCloseHandler = jest.fn()
        const component = wrapDNDIntl(
            <Router history={history}>
                <ReduxProvider store={store}>
                    <BoardSwitcherDialog onClose={onCloseHandler}/>
                </ReduxProvider>
            </Router>
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('find one, default category', async () => {
        const onCloseHandler = jest.fn()
        const newBoard = createBoard({id: 'found-board', title: 'hello', teamId: 'team-id-1'} as Board)

        mockedOctoClient.searchAll.mockResolvedValue([newBoard])
        mockedUtils.uuid.mockReturnValue('Really a UUID')

        const component = wrapDNDIntl(
            <Router history={history}>
                <ReduxProvider store={store}>
                    <BoardSwitcherDialog onClose={onCloseHandler}/>
                </ReduxProvider>
            </Router>
        )

        const {container} = render(component)
        await act(async () => {
            const inputElement = screen.getByPlaceholderText('Search for boards')
            await userEvent.type(inputElement, 'test')
            await wait(300)
        })
        expect(container).toMatchSnapshot()
    })

    test('find one, with custom category', async () => {
        const onCloseHandler = jest.fn()

        const myState = {
            users: {
                me: me,
            },
            teams: {
                allTeams: [team1, team2],
                current: team1,
            },
            sidebar: {
                categoryAttributes: [{
                    name: 'TestCategory',
                    boardIDs: ['found-board']
                },],
            }
        }
    
        const myStore = mockStateStore([], myState)

        const newBoard = createBoard({id: 'found-board', title: 'hello', teamId: 'team-id-1'} as Board)

        mockedOctoClient.searchAll.mockResolvedValue([newBoard])
        mockedUtils.uuid.mockReturnValue('Really a UUID')

        const component = wrapDNDIntl(
            <Router history={history}>
                <ReduxProvider store={myStore}>
                    <BoardSwitcherDialog onClose={onCloseHandler}/>
                </ReduxProvider>
            </Router>
        )

        const {container} = render(component)
        await act(async () => {
            const inputElement = screen.getByPlaceholderText('Search for boards')
            await userEvent.type(inputElement, 'test')
            await wait(300)
        })
        expect(container).toMatchSnapshot()
    })
})
