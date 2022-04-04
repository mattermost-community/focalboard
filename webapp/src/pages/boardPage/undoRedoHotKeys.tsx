// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {useHotkeys} from 'react-hotkeys-hook'

import {sendFlashMessage} from '../../components/flashMessages'
import mutator from '../../mutator'
import {Utils} from '../../utils'

const UndoRedoHotKeys = (): null => {
    useHotkeys('ctrl+z,cmd+z', () => {
        Utils.log('Undo')
        if (mutator.canUndo) {
            const description = mutator.undoDescription
            mutator.undo().then(() => {
                if (description) {
                    sendFlashMessage({content: `Undo ${description}`, severity: 'low'})
                } else {
                    sendFlashMessage({content: 'Undo', severity: 'low'})
                }
            })
        } else {
            sendFlashMessage({content: 'Nothing to Undo', severity: 'low'})
        }
    })

    useHotkeys('shift+ctrl+z,shift+cmd+z', () => {
        Utils.log('Redo')
        if (mutator.canRedo) {
            const description = mutator.redoDescription
            mutator.redo().then(() => {
                if (description) {
                    sendFlashMessage({content: `Redo ${description}`, severity: 'low'})
                } else {
                    sendFlashMessage({content: 'Redu', severity: 'low'})
                }
            })
        } else {
            sendFlashMessage({content: 'Nothing to Redo', severity: 'low'})
        }
    })
    return null
}

export default UndoRedoHotKeys
