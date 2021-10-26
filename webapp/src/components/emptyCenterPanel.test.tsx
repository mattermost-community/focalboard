// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {MockStoreEnhanced} from 'redux-mock-store'

import {mocked} from 'ts-jest/utils'

import {Provider as ReduxProvider} from 'react-redux'

import {MemoryRouter} from 'react-router-dom'

import Mutator from '../mutator'

import {Utils} from '../utils'

import {UserWorkspace} from '../user'

import {mockDOM, mockStateStore, wrapDNDIntl} from '../testUtils'

import EmptyCenterPanel from './emptyCenterPanel'

jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom')

    return {
        ...originalModule,
        useRouteMatch: jest.fn(() => {
            return {url: '/'}
        }),
    }
})
jest.mock('../utils')
jest.mock('../mutator')

describe('components/emptyCenterPanel', () => {
    const mockedUtils = mocked(Utils, true)
    const mockedMutator = mocked(Mutator, true)
    const workspace1: UserWorkspace = {
        id: 'workspace_1',
        title: 'Workspace 1',
        boardCount: 1,
    }
    const template1Title = 'Template 1'
    const globalTemplateTitle = 'Template Global'
    let store:MockStoreEnhanced<unknown, unknown>
    beforeAll(mockDOM)
    beforeEach(() => {
        jest.clearAllMocks()
        const state = {
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1),
                current: workspace1,
            },
            boards: {
                templates: [
                    {id: '1', title: template1Title, fields: {icon: '🚴🏻‍♂️'}},
                ],
            },
            globalTemplates: {
                value: [{id: 'global-1', title: globalTemplateTitle, fields: {icon: '🚴🏻‍♂️'}}],
            },
        }
        store = mockStateStore([], state)
    })
    describe('not a focalboard Plugin', () => {
        beforeAll(() => {
            mockedUtils.isFocalboardPlugin.mockReturnValue(false)
        })
        test('should match snapshot', () => {
            const {container} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <EmptyCenterPanel/>
                </ReduxProvider>
                ,
            ), {wrapper: MemoryRouter})
            expect(container).toMatchSnapshot()
        })
    })
    describe('a focalboard Plugin', () => {
        beforeAll(() => {
            mockedUtils.isFocalboardPlugin.mockReturnValue(true)
        })
        test('should match snapshot', () => {
            const {container} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <EmptyCenterPanel/>
                </ReduxProvider>
                ,
            ), {wrapper: MemoryRouter})
            expect(container).toMatchSnapshot()
        })
        test('return emptyCenterPanel and click new template', () => {
            const {container} = render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <EmptyCenterPanel/>
                </ReduxProvider>
                ,
            ), {wrapper: MemoryRouter})
            const divNewTemplate = container.querySelector('div.button.new-template')
            expect(divNewTemplate).not.toBeNull()
            userEvent.click(divNewTemplate!)
            expect(mockedMutator.insertBlocks).toBeCalledTimes(1)
        })
        test('return emptyCenterPanel and click empty board', () => {
            render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <EmptyCenterPanel/>
                </ReduxProvider>
                ,
            ), {wrapper: MemoryRouter})
            const divEmptyboard = screen.getByText('Start with an Empty Board').parentElement
            expect(divEmptyboard).not.toBeNull()
            userEvent.click(divEmptyboard!)
            expect(mockedMutator.insertBlocks).toBeCalledTimes(1)
        })
        test('return emptyCenterPanel and click to add board from template', async () => {
            render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <EmptyCenterPanel/>
                </ReduxProvider>
                ,
            ), {wrapper: MemoryRouter})
            const divAddBoard = screen.getByText(template1Title).parentElement
            expect(divAddBoard).not.toBeNull()
            userEvent.click(divAddBoard!)
            await waitFor(async () => {
                expect(mockedMutator.duplicateBoard).toBeCalledTimes(1)
            })
        })
        test('return emptyCenterPanel and click to add board from global template', async () => {
            render(wrapDNDIntl(
                <ReduxProvider store={store}>
                    <EmptyCenterPanel/>
                </ReduxProvider>
                ,
            ), {wrapper: MemoryRouter})
            const divAddBoard = screen.getByText(globalTemplateTitle).parentElement
            expect(divAddBoard).not.toBeNull()
            userEvent.click(divAddBoard!)
            await waitFor(async () => {
                expect(mockedMutator.duplicateFromRootBoard).toBeCalledTimes(1)
            })
        })
    })
})
