// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {useHotkeys} from 'react-hotkeys-hook'
import {useIntl} from 'react-intl'

import {sendFlashMessage} from '../../components/flashMessages'
import mutator from '../../mutator'
import {Utils} from '../../utils'

const UndoRedoHotKeys = (): null => {
    const intl = useIntl()

    useHotkeys('ctrl+z,cmd+z', (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null
        const isInputTag = target ? ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) : false
        const isTableTitleInput = Boolean(
            target &&
            target.tagName === 'INPUT' &&
            target.classList.contains('Editable') &&
            target.closest('.octo-table-row'),
        )

        // Keep native undo in non-table inputs (comments, markdown editor, etc).
        if (isInputTag && !isTableTitleInput) {
            return true
        }

        Utils.log('Undo')
        if (mutator.canUndo) {
            const description = mutator.undoDescription
            mutator.undo().then(() => {
                if (description) {
                    sendFlashMessage({
                        content: intl.formatMessage({id: 'UndoRedoHotKeys.canUndo-with-description', defaultMessage: 'Undo {description}'}, {description}),
                        severity: 'low',
                    })
                } else {
                    sendFlashMessage({
                        content: intl.formatMessage({id: 'UndoRedoHotKeys.canUndo', defaultMessage: 'Undo'}),
                        severity: 'low'})
                }
            })
        } else {
            sendFlashMessage({
                content: intl.formatMessage({id: 'UndoRedoHotKeys.cannotUndo', defaultMessage: 'Nothing to Undo'}),
                severity: 'low',
            })
        }
        // Prevent browser/input-level undo when board-level undo is triggered.
        return false
    }, {enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT']})

    useHotkeys('shift+ctrl+z,shift+cmd+z', (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null
        const isInputTag = target ? ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) : false
        const isTableTitleInput = Boolean(
            target &&
            target.tagName === 'INPUT' &&
            target.classList.contains('Editable') &&
            target.closest('.octo-table-row'),
        )

        if (isInputTag && !isTableTitleInput) {
            return true
        }

        Utils.log('Redo')
        if (mutator.canRedo) {
            const description = mutator.redoDescription
            mutator.redo().then(() => {
                if (description) {
                    sendFlashMessage({
                        content: intl.formatMessage({id: 'UndoRedoHotKeys.canRedo-with-description', defaultMessage: 'Redo {description}'}, {description}),
                        severity: 'low',
                    })
                } else {
                    sendFlashMessage({
                        content: intl.formatMessage({id: 'UndoRedoHotKeys.canRedo', defaultMessage: 'Redo'}),
                        severity: 'low',
                    })
                }
            })
        } else {
            sendFlashMessage({
                content: intl.formatMessage({id: 'UndoRedoHotKeys.cannotRedo', defaultMessage: 'Nothing to Redo'}),
                severity: 'low',
            })
        }
        return false
    }, {enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT']})
    return null
}

export default UndoRedoHotKeys
