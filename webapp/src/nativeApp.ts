// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {exportUserSettingsBlob, importUserSettingsBlob} from './userSettings'

declare interface INativeApp {
    settingsBlob: string | null;
    receiveMessage: (msg: any) => void | null
}

declare const NativeApp: INativeApp

export function importNativeAppSettings(): void {
    if (typeof NativeApp === 'undefined' || !NativeApp.settingsBlob) {
        return
    }
    const importedKeys = importUserSettingsBlob(NativeApp.settingsBlob)
    const messageType = importedKeys.length ? 'didImportUserSettings' : 'didNotImportUserSettings'
    postMessage({type: messageType, settingsBlob: exportUserSettingsBlob(), keys: importedKeys})
    NativeApp.settingsBlob = null
}

export function notifySettingsChanged(key: string): void {
    postMessage({type: 'didChangeUserSettings', settingsBlob: exportUserSettingsBlob(), key})
}

function postMessage(message: any) {
    if (typeof NativeApp === 'undefined' || !NativeApp.receiveMessage) {
        return
    }
    NativeApp.receiveMessage(message)
}
