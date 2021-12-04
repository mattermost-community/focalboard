// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {fireEvent, waitFor} from '@testing-library/dom'
import {mocked} from 'ts-jest/utils'

import {TextDecoder} from 'web-encoding'

import {Utils} from './utils'
import {IAppWindow} from './types'
import {Archiver} from './archiver'
import {createBlock} from './blocks/block'
import mutator from './mutator'
import {TestBlockFactory} from './test/testBlockFactory'

jest.mock('./mutator')
jest.mock('./utils.ts')
const mockedMutator = mocked(mutator, true)
const mockedUtils = mocked(Utils, true)
const mockedIAppWindow = mocked(window as unknown as IAppWindow, true)

global.TextDecoder = TextDecoder

describe('src/archiver', () => {
    const board = TestBlockFactory.createBoard()
    board.id = 'board1'
    describe('exportBoardArchive', () => {
        beforeEach(() => {
            jest.useFakeTimers('modern')
            jest.setSystemTime(new Date('2021-11-05'))
            document.body.innerHTML = ''
            jest.clearAllMocks()
            mockedIAppWindow.openInNewBrowser = jest.fn()
        })
        afterEach(jest.useRealTimers)
        test('should export board archive', async () => {
            const mockedBlock = createBlock()
            mockedBlock.id = board.id
            mockedMutator.exportArchive.mockResolvedValue([mockedBlock])
            await Archiver.exportBoardArchive(board)
            expect(mockedMutator.exportArchive).toBeCalledWith(board.id)
            expect(mockedIAppWindow.openInNewBrowser).toBeCalled()
            expect(document.body).toMatchSnapshot()
        })
        test('should export full archive', async () => {
            const mockedBlock = createBlock()
            mockedBlock.id = board.id
            mockedMutator.exportArchive.mockResolvedValue([mockedBlock])
            await Archiver.exportFullArchive()
            expect(mockedMutator.exportArchive).toBeCalled()
            expect(mockedIAppWindow.openInNewBrowser).toBeCalled()
            expect(document.body).toMatchSnapshot()
        })
    })
    describe('isValidBlock', () => {
        beforeEach(() => {
            jest.clearAllMocks()
            document.body.innerHTML = ''
        })
        test('should validate block', () => {
            const mockedBlock = createBlock()
            mockedBlock.id = board.id
            mockedBlock.rootId = board.id
            expect(Archiver.isValidBlock(mockedBlock)).toBeTruthy()
        })
        test('should not validate block', () => {
            const mockedBlock = createBlock()
            expect(Archiver.isValidBlock(mockedBlock)).toBeFalsy()
        })
    })
    describe('importFullArchive', () => {
        const mockedComplete = jest.fn()
        beforeEach(() => {
            jest.clearAllMocks()
            document.body.innerHTML = ''
        })
        test('should import full archive', async () => {
            await Archiver.importFullArchive(mockedComplete)
            const elementInput = document.querySelector('input')
            fireEvent.change(elementInput!, {
                target: {
                    files: [new File(['{"version":1,"date":1636070400000}\n{"type":"block","data":{"id":"board1","schema":1,"workspaceId":"","parentId":"","rootId":"board1","createdBy":"","modifiedBy":"","type":"unknown","fields":{},"title":"","createAt":1636070400000,"updateAt":1636070400000,"deleteAt":0}}\n{"type":"block","data":{"id":"board2","schema":2,"workspaceId":"","parentId":"","rootId":"board2","createdBy":"","modifiedBy":"","type":"unknown","fields":{},"title":"","createAt":1636070400000,"updateAt":1636070400000,"deleteAt":0}}'], 'myfocalboard.focalboard', {type: 'text/json'})],
                },
            })
            await waitFor(async () => {
                expect(mockedComplete).toBeCalled()
                expect(mockedMutator.importFullArchive).toBeCalledTimes(1)
            })
        })
        test('shouldn\'t import full archive', async () => {
            await Archiver.importFullArchive(mockedComplete)
            const elementInput = document.querySelector('input')
            fireEvent.change(elementInput!, {
                target: {
                    files: [new File(['{"version":1,"date":1636070400000}\n{"type":"block"}'], 'myfocalboard.focalboard', {type: 'text/json'})],
                },
            })
            await waitFor(async () => {
                expect(mockedUtils.logError).toBeCalledWith('importFullArchive ERROR parsing line')
            })
        })
    })
})
