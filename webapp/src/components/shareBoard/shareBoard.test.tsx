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

    // let rootPortalDiv: HTMLDivElement

    const rootPortalDiv = document.createElement('div')
    rootPortalDiv.id = 'focalboard-root-portal'

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
        const result = render(
            wrapDNDIntl(
                <ShareBoard
                    boardId={board.id}
                    onClose={jest.fn()}
                />),
            {wrapper: MemoryRouter},
        )
        const renderer = result.container

        expect(renderer).toMatchSnapshot()
        const closeButton = screen.getByRole('button', {name: 'Close dialog'})
        expect(closeButton).toBeDefined()
    })

    test('should match snapshot, and click switch', async () => {
        mockedOctoClient.getSharing.mockResolvedValue(undefined)
        const result = render(
            wrapDNDIntl(
                <ShareBoard
                    boardId={board.id}
                    onClose={jest.fn()}
                />),
            {wrapper: MemoryRouter},
        )
        const renderer = result.container
        expect(renderer).toMatchSnapshot()

        const switchElement = renderer.querySelector('.Switch')
        expect(switchElement).toBeDefined()

        // await act(async () => {
        userEvent.click(switchElement!)

        // })

        expect(mockedOctoClient.setSharing).toBeCalledTimes(1)
        expect(mockedOctoClient.getSharing).toBeCalledTimes(1)
    })

    test('should match snapshot with sharing', async () => {
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)

        let renderer
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ShareBoard
                        boardId={board.id}
                        onClose={jest.fn()}
                    />),
                {wrapper: MemoryRouter},
            )
            renderer = result.container
        })
        const copyLinkElement = screen.getByRole('button', {name: 'Copy link'})
        expect(copyLinkElement).toBeDefined()

        expect(renderer).toMatchSnapshot()
    })

    test('return shareBoard and click Copy link', async () => {
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)

        let renderer
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ShareBoard
                        boardId={board.id}
                        onClose={jest.fn()}
                    />),
                {wrapper: MemoryRouter},
            )
            renderer = result.container
        })

        expect(renderer).toMatchSnapshot()

        const copyLinkElement = screen.getByRole('button', {name: 'Copy link'})
        expect(copyLinkElement).toBeDefined()

        await act(async () => {
            userEvent.click(copyLinkElement!)
        })

        expect(mockedUtils.copyTextToClipboard).toBeCalledTimes(1)
        expect(renderer).toMatchSnapshot()

        const copiedLinkElement = screen.getByRole('button', {name: 'Copy link'})
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

        let renderer
        await act(async () => {
            const result = render(
                wrapDNDIntl(
                    <ShareBoard
                        boardId={board.id}
                        onClose={jest.fn()}
                    />),
                {wrapper: MemoryRouter},
            )
            renderer = result.container
        })

        sharing.token = 'anotherToken'
        mockedUtils.createGuid.mockReturnValue('anotherToken')
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        mockedOctoClient.setSharing.mockResolvedValue(true)
        const regenerateTokenElement = screen.getByRole('button', {name: 'Regenerate token'})
        expect(regenerateTokenElement).toBeDefined()
        userEvent.click(regenerateTokenElement)
        await act(async () => {
            jest.runOnlyPendingTimers()
        })
        expect(mockedOctoClient.setSharing).toBeCalledTimes(1)
        expect(renderer).toMatchSnapshot()
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
        let renderer
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ShareBoard
                    boardId={board.id}
                    onClose={jest.fn()}
                />), {wrapper: MemoryRouter})
            renderer = result.container
        })
        expect(renderer).toMatchSnapshot()
    })

    test('should match snapshot with sharing and subpath', async () => {
        w.baseURL = '/test-subpath/plugins/boards'
        const sharing:ISharing = {
            id: boardId,
            enabled: true,
            token: 'oneToken',
        }
        mockedOctoClient.getSharing.mockResolvedValue(sharing)
        let renderer
        await act(async () => {
            const result = render(wrapDNDIntl(
                <ShareBoard
                    boardId={board.id}
                    onClose={jest.fn()}
                />), {wrapper: MemoryRouter})
            renderer = result.container
        })
        expect(renderer).toMatchSnapshot()
    })
})
