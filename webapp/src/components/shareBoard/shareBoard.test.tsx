// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import React from 'react'
import {MemoryRouter} from 'react-router'
import {mocked} from 'ts-jest/utils'

import {ISharing} from '../../blocks/sharing'
import {TestBlockFactory} from '../../test/testBlockFactory'
import {wrapDNDIntl} from '../../testUtils'
import client from '../../octoClient'
import {Utils} from '../../utils'

import ShareBoard from './shareBoard'

jest.useFakeTimers()

const boardId = '1'
const workspaceId: string|undefined = boardId
const viewId = boardId

jest.mock('../../octoClient')
jest.mock('../../utils')

const mockedOctoClient = mocked(client, true)
const mockedUtils = mocked(Utils, true)

let params = {}
jest.mock('react-router', () => {
    const originalModule = jest.requireActual('react-router')

    return {
        ...originalModule,
        useRouteMatch: jest.fn(() => {
            return {
                url: 'http://localhost/',
                path: '/',
                params,
                isExact: true,
            }
        }),
    }
})
const board = TestBlockFactory.createBoard()
board.id = boardId

describe('src/components/shareBoard/shareBoard', () => {
    const w = (window as any)
    const oldBaseURL = w.baseURL

    beforeEach(() => {
        jest.clearAllMocks()
        mockedUtils.buildURL.mockImplementation((path) => (w.baseURL || '') + path)

        params = {
            boardId,
            viewId,
            workspaceId,
        }
    })

    afterEach(() => {
        w.baseURL = oldBaseURL
    })

    test('should match snapshot', async () => {
        mockedOctoClient.getSharing.mockResolvedValue(undefined)
        let container
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ShareBoard
                        boardId={board.id}
                        onClose={jest.fn()}
                        enableSharedBoards={true}
                    />),
                {wrapper: MemoryRouter},
            )
            container = result.container
        })

        expect(container).toMatchSnapshot()
        const closeButton = screen.getByRole('button', {name: 'Close dialog'})
        expect(closeButton).toBeDefined()
    })

    test('should match snapshot with sharing', async () => {
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)

        let container
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ShareBoard
                        boardId={board.id}
                        onClose={jest.fn()}
                        enableSharedBoards={true}
                    />),
                {wrapper: MemoryRouter},
            )
            container = result.container
        })
        const copyLinkElement = screen.getByRole('button', {name: 'Copy internal link'})
        expect(copyLinkElement).toBeDefined()

        expect(container).toMatchSnapshot()
    })

    test('return shareBoard and click Copy link', async () => {
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)

        let container
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ShareBoard
                        boardId={board.id}
                        onClose={jest.fn()}
                        enableSharedBoards={true}
                    />),
                {wrapper: MemoryRouter},
            )
            container = result.container
        })

        expect(container).toMatchSnapshot()

        const copyLinkElement = screen.getByRole('button', {name: 'Copy internal link'})
        expect(copyLinkElement).toBeDefined()

        await act(async () => {
            userEvent.click(copyLinkElement!)
        })

        expect(mockedUtils.copyTextToClipboard).toBeCalledTimes(1)
        expect(container).toMatchSnapshot()

        const copiedLinkElement = screen.getByRole('button', {name: 'Copy internal link'})
        expect(copiedLinkElement).toBeDefined()
        expect(copiedLinkElement.textContent).toContain('Copied!')
    })

    test('return shareBoard and click Regenerate token', async () => {
        window.confirm = jest.fn(() => {
            return true
        })
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)

        let container
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ShareBoard
                        boardId={board.id}
                        onClose={jest.fn()}
                        enableSharedBoards={true}
                    />),
                {wrapper: MemoryRouter},
            )
            container = result.container
        })

        sharing.token = 'anotherToken'
        mockedUtils.createGuid.mockReturnValue('anotherToken')
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        mockedOctoClient.setSharing.mockResolvedValue(true)

        const publishButton = screen.getByRole('button', {name: 'Publish'})
        expect(publishButton).toBeDefined()
        userEvent.click(publishButton)
        await act(async () => {
            jest.runOnlyPendingTimers()
        })

        const regenerateTokenElement = screen.getByRole('button', {name: 'Regenerate token'})
        expect(regenerateTokenElement).toBeDefined()
        userEvent.click(regenerateTokenElement)
        await act(async () => {
            jest.runOnlyPendingTimers()
        })
        expect(mockedOctoClient.setSharing).toBeCalledTimes(1)
        expect(container).toMatchSnapshot()
    })
    test('return shareBoard, and click switch', async () => {
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        let container: Element | undefined
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ShareBoard
                        boardId={board.id}
                        onClose={jest.fn()}
                        enableSharedBoards={true}
                    />),
                {wrapper: MemoryRouter},
            )
            container = result.container
        })

        const publishButton = screen.getByRole('button', {name: 'Publish'})
        expect(publishButton).toBeDefined()
        userEvent.click(publishButton)
        await act(async () => {
            jest.runOnlyPendingTimers()
        })

        const switchElement = container?.querySelector('.Switch')
        expect(switchElement).toBeDefined()
        await act(async () => {
            userEvent.click(switchElement!)
        })

        expect(mockedOctoClient.setSharing).toBeCalledTimes(1)
        expect(mockedOctoClient.getSharing).toBeCalledTimes(2)
        expect(container).toMatchSnapshot()
    })
    test('return shareBoardComponent and click Switch without sharing', async () => {
        mockedOctoClient.getSharing.mockResolvedValue(undefined)
        mockedUtils.createGuid.mockReturnValue('aToken')
        let container: Element | undefined
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ShareBoard
                        boardId={board.id}
                        onClose={jest.fn()}
                        enableSharedBoards={true}
                    />),
                {wrapper: MemoryRouter},
            )
            container = result.container
            mockedOctoClient.getSharing.mockResolvedValue({
                id: boardId,
                enabled: true,
                token: 'aToken',
            })

            const publishButton = screen.getByRole('button', {name: 'Publish'})
            expect(publishButton).toBeDefined()
            userEvent.click(publishButton)
            jest.runOnlyPendingTimers()

            const switchElement = container?.querySelector('.Switch')
            expect(switchElement).toBeDefined()
            userEvent.click(switchElement!)
            jest.runOnlyPendingTimers()
            result.rerender(
                wrapDNDIntl(
                    <ShareBoard
                        boardId={board.id}
                        onClose={jest.fn()}
                        enableSharedBoards={true}
                    />))
        })

        expect(mockedOctoClient.setSharing).toBeCalledTimes(1)
        expect(mockedOctoClient.getSharing).toBeCalledTimes(2)
        expect(mockedUtils.createGuid).toBeCalledTimes(1)
        expect(container).toMatchSnapshot()
    })
    test('should match snapshot with sharing and without workspaceId and subpath', async () => {
        w.baseURL = '/test-subpath/plugins/boards'
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        params = {
            boardId,
            viewId,
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        let container
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ShareBoard
                    boardId={board.id}
                    onClose={jest.fn()}
                    enableSharedBoards={true}
                />), {wrapper: MemoryRouter})
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot with sharing and subpath', async () => {
        w.baseURL = '/test-subpath/plugins/boards'
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        let container
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ShareBoard
                    boardId={board.id}
                    onClose={jest.fn()}
                    enableSharedBoards={true}
                />), {wrapper: MemoryRouter})
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })
})
