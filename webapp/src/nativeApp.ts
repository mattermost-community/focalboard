// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {exportUserSettingsBlob, importUserSettingsBlob} from './userSettings'

declare interface INativeApp {
    settingsBlob: string | null;
}

declare const NativeApp: INativeApp

export function importNativeAppSettings() {
    if (typeof NativeApp === 'undefined' || !NativeApp.settingsBlob) {
        return
    }
    const success = importUserSettingsBlob(NativeApp.settingsBlob)
    const messageType = success ? 'didImportUserSettings' : 'didNotImportUserSettings'
    postWebKitMessage({type: messageType, settingsBlob: NativeApp.settingsBlob})
    NativeApp.settingsBlob = null
}

export function notifySettingsChanged(key: string) {
    postWebKitMessage({type: 'didChangeUserSettings', key, settingsBlob: exportUserSettingsBlob()})
}

function postWebKitMessage(message: any) {
    (window as any).webkit?.messageHandlers.nativeApp?.postMessage(message)
}
