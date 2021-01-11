// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import undoManager from './undomanager'

test('Basic undo/redo', async () => {
    expect(undoManager.canUndo).toBe(false)
    expect(undoManager.canRedo).toBe(false)
    expect(undoManager.currentCheckpoint).toBe(0)

    const values: string[] = []

    await undoManager.perform(
        async () => {
            values.push('a')
        },
        async () => {
            values.pop()
        },
        'test',
    )

    expect(undoManager.canUndo).toBe(true)
    expect(undoManager.canRedo).toBe(false)
    expect(undoManager.currentCheckpoint).toBeGreaterThan(0)
    expect(values).toEqual(['a'])
    expect(undoManager.undoDescription).toBe('test')
    expect(undoManager.redoDescription).toBe(undefined)

    await undoManager.undo()
    expect(undoManager.canUndo).toBe(false)
    expect(undoManager.canRedo).toBe(true)
    expect(values).toEqual([])
    expect(undoManager.undoDescription).toBe(undefined)
    expect(undoManager.redoDescription).toBe('test')

    await undoManager.redo()
    expect(undoManager.canUndo).toBe(true)
    expect(undoManager.canRedo).toBe(false)
    expect(values).toEqual(['a'])

    await undoManager.clear()
    expect(undoManager.canUndo).toBe(false)
    expect(undoManager.canRedo).toBe(false)
    expect(undoManager.currentCheckpoint).toBe(0)
    expect(undoManager.undoDescription).toBe(undefined)
    expect(undoManager.redoDescription).toBe(undefined)
})

test('Grouped undo/redo', async () => {
    expect(undoManager.canUndo).toBe(false)
    expect(undoManager.canRedo).toBe(false)

    const values: string[] = []
    const groupId = 'the group id'

    await undoManager.perform(
        async () => {
            values.push('a')
        },
        async () => {
            values.pop()
        },
        'insert a',
    )

    expect(undoManager.canUndo).toBe(true)
    expect(undoManager.canRedo).toBe(false)
    expect(values).toEqual(['a'])
    expect(undoManager.undoDescription).toBe('insert a')
    expect(undoManager.redoDescription).toBe(undefined)

    await undoManager.perform(
        async () => {
            values.push('b')
        },
        async () => {
            values.pop()
        },
        'insert b',
        groupId,
    )

    expect(undoManager.canUndo).toBe(true)
    expect(undoManager.canRedo).toBe(false)
    expect(values).toEqual(['a', 'b'])
    expect(undoManager.undoDescription).toBe('insert b')
    expect(undoManager.redoDescription).toBe(undefined)

    await undoManager.perform(
        async () => {
            values.push('c')
        },
        async () => {
            values.pop()
        },
        'insert c',
        groupId,
    )

    expect(undoManager.canUndo).toBe(true)
    expect(undoManager.canRedo).toBe(false)
    expect(values).toEqual(['a', 'b', 'c'])
    expect(undoManager.undoDescription).toBe('insert c')
    expect(undoManager.redoDescription).toBe(undefined)

    await undoManager.undo()
    expect(undoManager.canUndo).toBe(true)
    expect(undoManager.canRedo).toBe(true)
    expect(values).toEqual(['a'])
    expect(undoManager.undoDescription).toBe('insert a')
    expect(undoManager.redoDescription).toBe('insert b')

    await undoManager.redo()
    expect(undoManager.canUndo).toBe(true)
    expect(undoManager.canRedo).toBe(false)
    expect(values).toEqual(['a', 'b', 'c'])
    expect(undoManager.undoDescription).toBe('insert c')
    expect(undoManager.redoDescription).toBe(undefined)

    await undoManager.clear()
    expect(undoManager.canUndo).toBe(false)
    expect(undoManager.canRedo).toBe(false)
    expect(undoManager.undoDescription).toBe(undefined)
    expect(undoManager.redoDescription).toBe(undefined)
})
