// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'
import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import 'isomorphic-fetch'

import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'

import {TestBlockFactory} from '../../test/testBlockFactory'
import {FetchMock} from '../../test/fetchMock'
import {MutableBoardTree} from '../../viewModel/boardTree'

import {IUser, WorkspaceUsersContext} from '../../user'

import {Utils} from '../../utils'

import Table from './table'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

const wrapProviders = (children: any) => {
    return (
        <DndProvider backend={HTML5Backend}>
            <IntlProvider locale='en'>{children}</IntlProvider>
        </DndProvider>
    )
}

describe('components/table/Table', () => {
    const board = TestBlockFactory.createBoard()
    const view = TestBlockFactory.createBoardView(board)
    view.viewType = 'table'
    view.groupById = undefined
    view.visiblePropertyIds = ['property1', 'property2']

    const view2 = TestBlockFactory.createBoardView(board)
    view2.sortOptions = []

    const card = TestBlockFactory.createCard(board)
    const cardTemplate = TestBlockFactory.createCard(board)
    cardTemplate.isTemplate = true

    test('should match snapshot', async () => {
        // Sync
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))
        FetchMock.fn.mockReturnValue(FetchMock.jsonResponse(JSON.stringify([{username: 'username_1'}, {username: 'username_2'}])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).not.toBeUndefined()
        if (!boardTree) {
            fail('sync')
        }

        expect(FetchMock.fn).toBeCalledTimes(2)
        expect(boardTree.cards).toBeDefined()
        expect(boardTree.cards).toEqual([card])

        const callback = jest.fn()
        const addCard = jest.fn()

        const component = wrapProviders(
            <Table
                boardTree={boardTree!}
                selectedCardIds={[]}
                readonly={false}
                cardIdToFocusOnRender=''
                showCard={callback}
                addCard={addCard}
                onCardClicked={jest.fn()}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, read-only', async () => {
        // Sync
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))
        FetchMock.fn.mockReturnValue(FetchMock.jsonResponse(JSON.stringify([{username: 'username_1'}, {username: 'username_2'}])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).toBeDefined()
        expect(FetchMock.fn).toBeCalledTimes(2)

        const callback = jest.fn()
        const addCard = jest.fn()

        const component = wrapProviders(
            <Table
                boardTree={boardTree!}
                selectedCardIds={[]}
                readonly={true}
                cardIdToFocusOnRender=''
                showCard={callback}
                addCard={addCard}
                onCardClicked={jest.fn()}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot with GroupBy', async () => {
        // Sync
        view.groupById = 'property1'
        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, view, view2, card, cardTemplate])))
        FetchMock.fn.mockReturnValue(FetchMock.jsonResponse(JSON.stringify([{username: 'username_1'}, {username: 'username_2'}])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).not.toBeUndefined()
        if (!boardTree) {
            fail('sync')
        }

        expect(FetchMock.fn).toBeCalledTimes(2)
        expect(boardTree.cards).toBeDefined()
        expect(boardTree.cards).toEqual([card])

        const callback = jest.fn()
        const addCard = jest.fn()

        const component = wrapProviders(
            <Table
                boardTree={boardTree!}
                selectedCardIds={[]}
                readonly={false}
                cardIdToFocusOnRender=''
                showCard={callback}
                addCard={addCard}
                onCardClicked={jest.fn()}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})

describe('components/table/Table extended', () => {
    test('should match snapshot with CreatedBy', async () => {
        const board = TestBlockFactory.createBoard()

        const dateCreatedId = Utils.createGuid()
        board.cardProperties.push({
            id: dateCreatedId,
            name: 'Date Created',
            type: 'createdTime',
            options: [],
        })

        const card1 = TestBlockFactory.createCard(board)
        card1.createAt = Date.parse('15 Jun 2021 16:22:00')

        const card2 = TestBlockFactory.createCard(board)
        card2.createAt = Date.parse('15 Jun 2021 16:22:00')

        const view = TestBlockFactory.createBoardView(board)
        view.viewType = 'table'
        view.groupById = undefined
        view.visiblePropertyIds = ['property1', 'property2', dateCreatedId]

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, card1, card2, view])))
        FetchMock.fn.mockReturnValue(FetchMock.jsonResponse(JSON.stringify([{username: 'username_1'}, {username: 'username_2'}])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).not.toBeUndefined()
        if (!boardTree) {
            fail('sync')
        }

        const callback = jest.fn()
        const addCard = jest.fn()

        const component = wrapProviders(
            <Table
                boardTree={boardTree!}
                selectedCardIds={[]}
                readonly={false}
                cardIdToFocusOnRender=''
                showCard={callback}
                addCard={addCard}
                onCardClicked={jest.fn()}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot with UpdatedAt', async () => {
        const board = TestBlockFactory.createBoard()

        const dateUpdatedId = Utils.createGuid()
        board.cardProperties.push({
            id: dateUpdatedId,
            name: 'Date Updated',
            type: 'updatedTime',
            options: [],
        })

        const card1 = TestBlockFactory.createCard(board)
        card1.updateAt = Date.parse('20 Jun 2021 12:22:00')

        const card2 = TestBlockFactory.createCard(board)
        card2.updateAt = Date.parse('20 Jun 2021 12:22:00')

        const card2Comment = TestBlockFactory.createCard(board)
        card2Comment.parentId = card2.id
        card2Comment.type = 'comment'
        card2Comment.updateAt = Date.parse('21 Jun 2021 15:23:00')

        const card2Text = TestBlockFactory.createCard(board)
        card2Text.parentId = card2.id
        card2Text.type = 'text'
        card2Text.updateAt = Date.parse('22 Jun 2021 11:23:00')

        const view = TestBlockFactory.createBoardView(board)
        view.viewType = 'table'
        view.groupById = undefined
        view.visiblePropertyIds = ['property1', 'property2', dateUpdatedId]

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, card1, card2, view, card2Comment, card2Text])))
        FetchMock.fn.mockReturnValue(FetchMock.jsonResponse(JSON.stringify([{username: 'username_1'}, {username: 'username_2'}])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).not.toBeUndefined()
        if (!boardTree) {
            fail('sync')
        }

        const callback = jest.fn()
        const addCard = jest.fn()

        const component = wrapProviders(
            <Table
                boardTree={boardTree!}
                selectedCardIds={[]}
                readonly={false}
                cardIdToFocusOnRender=''
                showCard={callback}
                addCard={addCard}
                onCardClicked={jest.fn()}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot with CreatedBy', async () => {
        const board = TestBlockFactory.createBoard()

        const createdById = Utils.createGuid()
        board.cardProperties.push({
            id: createdById,
            name: 'Created By',
            type: 'createdBy',
            options: [],
        })

        const card1 = TestBlockFactory.createCard(board)
        card1.createdBy = 'user-id-1'

        const card2 = TestBlockFactory.createCard(board)
        card2.createdBy = 'user-id-2'

        const view = TestBlockFactory.createBoardView(board)
        view.viewType = 'table'
        view.groupById = undefined
        view.visiblePropertyIds = ['property1', 'property2', createdById]

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, card1, card2, view])))
        FetchMock.fn.mockReturnValue(FetchMock.jsonResponse(JSON.stringify([{username: 'username_1'}, {username: 'username_2'}])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).not.toBeUndefined()
        if (!boardTree) {
            fail('sync')
        }

        const callback = jest.fn()
        const addCard = jest.fn()

        const workspaceUsers = {
            users: new Array<IUser>(),
            usersById: new Map<string, IUser>(),
        }
        workspaceUsers.usersById.set('user-id-1', {username: 'username_1'} as IUser)
        workspaceUsers.usersById.set('user-id-2', {username: 'username_2'} as IUser)

        const component = wrapProviders(
            <WorkspaceUsersContext.Provider value={workspaceUsers}>
                <Table
                    boardTree={boardTree!}
                    selectedCardIds={[]}
                    readonly={false}
                    cardIdToFocusOnRender=''
                    showCard={callback}
                    addCard={addCard}
                    onCardClicked={jest.fn()}
                />
            </WorkspaceUsersContext.Provider>,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot with UpdatedBy', async () => {
        const board = TestBlockFactory.createBoard()

        const modifiedById = Utils.createGuid()
        board.cardProperties.push({
            id: modifiedById,
            name: 'Last Modified By',
            type: 'updatedBy',
            options: [],
        })

        const card1 = TestBlockFactory.createCard(board)
        card1.modifiedBy = 'user-id-1'
        card1.updateAt = Date.parse('15 Jun 2021 16:22:00')

        const card1Text = TestBlockFactory.createCard(board)
        card1Text.parentId = card1.id
        card1Text.type = 'text'
        card1Text.modifiedBy = 'user-id-4'
        card1Text.updateAt = Date.parse('16 Jun 2021 16:22:00')

        const card2 = TestBlockFactory.createCard(board)
        card2.modifiedBy = 'user-id-2'
        card2.updateAt = Date.parse('15 Jun 2021 16:22:00')

        const card2Comment = TestBlockFactory.createCard(board)
        card2Comment.parentId = card2.id
        card2Comment.type = 'comment'
        card2Comment.modifiedBy = 'user-id-3'
        card2.updateAt = Date.parse('16 Jun 2021 16:22:00')

        const view = TestBlockFactory.createBoardView(board)
        view.viewType = 'table'
        view.groupById = undefined
        view.visiblePropertyIds = ['property1', 'property2', modifiedById]

        FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, card1, card2, view, card2Comment, card1Text])))
        FetchMock.fn.mockReturnValue(FetchMock.jsonResponse(JSON.stringify([{username: 'username_3'}, {username: 'username_4'}])))

        const boardTree = await MutableBoardTree.sync(board.id, view.id)
        expect(boardTree).not.toBeUndefined()
        if (!boardTree) {
            fail('sync')
        }

        const callback = jest.fn()
        const addCard = jest.fn()

        const workspaceUsers = {
            users: new Array<IUser>(),
            usersById: new Map<string, IUser>(),
        }
        workspaceUsers.usersById.set('user-id-3', {username: 'username_3'} as IUser)
        workspaceUsers.usersById.set('user-id-4', {username: 'username_4'} as IUser)

        const component = wrapProviders(
            <WorkspaceUsersContext.Provider value={workspaceUsers}>
                <Table
                    boardTree={boardTree!}
                    selectedCardIds={[]}
                    readonly={false}
                    cardIdToFocusOnRender=''
                    showCard={callback}
                    addCard={addCard}
                    onCardClicked={jest.fn()}
                />
            </WorkspaceUsersContext.Provider>,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
