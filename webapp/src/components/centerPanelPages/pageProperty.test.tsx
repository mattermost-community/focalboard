// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import '@testing-library/jest-dom'
import {act, render} from '@testing-library/react'

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'

import {IPropertyTemplate} from '../../blocks/board'
import {TestBlockFactory} from '../../test/testBlockFactory'
import {mockDOM, mockStateStore, wrapIntl} from '../../testUtils'

import PageProperty from './pageProperty'

beforeAll(() => {
    mockDOM()
})

describe('components/pageProperty', () => {
    const board = TestBlockFactory.createBoard()
    board.id = 'test-id'
    const fakeProperty: IPropertyTemplate = {id: 'test-prop', name: 'Test prop', type: 'text', options: []}
    const state = {
        users: {
            boardUsers: {
                1: {username: 'abc'},
                2: {username: 'd'},
                3: {username: 'e'},
                4: {username: 'f'},
                5: {username: 'g'},
            },
        },
        teams: {
            current: {id: 'team-id'},
        },
        boards: {
            current: board.id,
            boards: {
                [board.id]: board,
            },
            myBoardMemberships: {
                [board.id]: {userId: 'user_id_1', schemeAdmin: true},
            },
        },
        clientConfig: {
            value: {},
        },
    }
    const store = mockStateStore([], state)

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should match snapshot without value', async () => {
        let container
        const page = TestBlockFactory.createPage(board)
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <PageProperty
                        page={page}
                        board={board}
                        readonly={false}
                        canEditBoardProperties={true}
                        canEditBoardCards={true}
                        newTemplateId={''}
                        propertyTemplate={fakeProperty}
                    />
                </ReduxProvider>,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot with value', async () => {
        let container
        const page = TestBlockFactory.createPage(board)
        page.fields.properties = {'test-prop': 'Test value'}
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <PageProperty
                        page={page}
                        board={board}
                        readonly={false}
                        canEditBoardProperties={true}
                        canEditBoardCards={true}
                        newTemplateId={''}
                        propertyTemplate={fakeProperty}
                    />
                </ReduxProvider>,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot readonly without value', async () => {
        let container
        const page = TestBlockFactory.createPage(board)
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <PageProperty
                        page={page}
                        board={board}
                        readonly={true}
                        canEditBoardProperties={true}
                        canEditBoardCards={true}
                        newTemplateId={''}
                        propertyTemplate={fakeProperty}
                    />
                </ReduxProvider>,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot readonly with value', async () => {
        let container
        const page = TestBlockFactory.createPage(board)
        page.fields.properties = {'test-prop': 'Test value'}
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <PageProperty
                        page={page}
                        board={board}
                        readonly={true}
                        canEditBoardProperties={true}
                        canEditBoardCards={true}
                        newTemplateId={''}
                        propertyTemplate={fakeProperty}
                    />
                </ReduxProvider>,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot without edit board permissions', async () => {
        let container
        const page = TestBlockFactory.createPage(board)
        page.fields.properties = {'test-prop': 'Test value'}
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <PageProperty
                        page={page}
                        board={board}
                        readonly={false}
                        canEditBoardProperties={false}
                        canEditBoardCards={true}
                        newTemplateId={''}
                        propertyTemplate={fakeProperty}
                    />
                </ReduxProvider>,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot without edit card permissions', async () => {
        let container
        const page = TestBlockFactory.createPage(board)
        page.fields.properties = {'test-prop': 'Test value'}
        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <PageProperty
                        page={page}
                        board={board}
                        readonly={false}
                        canEditBoardProperties={true}
                        canEditBoardCards={false}
                        newTemplateId={''}
                        propertyTemplate={fakeProperty}
                    />
                </ReduxProvider>,
            ))
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })
})
