// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {importUserSettingsBlob} from './userSettings'

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

function postWebKitMessage(message: any) {
    const webkit = (window as any).webkit
    if (typeof webkit === 'undefined') {
        return
    }
    const handler = webkit.messageHandlers.nativeApp
    if (typeof handler === 'undefined') {
        return
    }
    handler.postMessage(message)
}
