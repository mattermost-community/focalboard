// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {notifySettingsChanged} from './nativeApp'
import {Utils} from './utils'

// eslint-disable-next-line no-shadow
enum UserSettingKey {
    Language = 'language',
    Theme = 'theme',
    LastWorkspaceId = 'lastWorkspaceId',
    LastBoardId = 'lastBoardId',
    LastViewId = 'lastViewId',
    EmojiMartSkin = 'emoji-mart.skin',
    EmojiMartLast = 'emoji-mart.last',
    EmojiMartFrequently = 'emoji-mart.frequently',
    RandomIcons = 'randomIcons',
    MobileWarningClosed = 'mobileWarningClosed',
    WelcomePageViewed = 'welcomePageViewed',
    DashboardShowEmpty = 'dashboardShowEmpty'
}

export class UserSettings {
    static get(key: UserSettingKey): string | null {
        return localStorage.getItem(key)
    }

    static set(key: UserSettingKey, value: string | null): void {
        if (!Object.values(UserSettingKey).includes(key)) {
            return
        }
        if (value === null) {
            localStorage.removeItem(key)
        } else {
            localStorage.setItem(key, value)
        }
        notifySettingsChanged(key)
    }

    static get language(): string | null {
        return UserSettings.get(UserSettingKey.Language)
    }

    static set language(newValue: string | null) {
        UserSettings.set(UserSettingKey.Language, newValue)
    }

    static get welcomePageViewed(): string | null {
        return UserSettings.get(UserSettingKey.WelcomePageViewed)
    }

    static set welcomePageViewed(newValue: string | null) {
        UserSettings.set(UserSettingKey.WelcomePageViewed, newValue)
    }

    static get theme(): string | null {
        return UserSettings.get(UserSettingKey.Theme)
    }

    static set theme(newValue: string | null) {
        UserSettings.set(UserSettingKey.Theme, newValue)
    }

    static get lastWorkspaceId(): string | null {
        return UserSettings.get(UserSettingKey.LastWorkspaceId)
    }

    static set lastWorkspaceId(newValue: string | null) {
        UserSettings.set(UserSettingKey.LastWorkspaceId, newValue)
    }

    // maps last board ID for each team
    // maps teamID -> board ID
    static get lastBoardId(): Map<string, string> {
        let rawData = UserSettings.get(UserSettingKey.LastBoardId) || '{}'
        if (rawData[0] !== '{') {
            rawData = '{}'
        }

        let mapping: Map<string, string>
        try {
            mapping = new Map<string, string>(Object.entries(JSON.parse(rawData)))
        } catch (e) {
            console.log(e)

            // revert to empty data if JSON conversion fails.
            // This will happen when users run the new code for the first time
            mapping = new Map<string, string>()
        }

        return mapping
    }

    // static set lastBoardId(newValue: Map<string, string> | null) {
    //     UserSettings.set(UserSettingKey.LastBoardId, JSON.stringify(newValue))
    // }

    static setLastBoardID(teamID: string, boardID: string) {
        const data = this.lastBoardId
        console.log(data)
        data.set(teamID, boardID)
        UserSettings.set(UserSettingKey.LastBoardId, JSON.stringify(data))
    }

    static get lastViewId(): Map<string, string> | null {
        const rawData = UserSettings.get(UserSettingKey.LastViewId) || '{}'
        let mapping: Map<string, string>
        try {
            mapping = new Map<string, string>(Object.entries(JSON.parse(rawData)))
        } catch {
            // revert to empty data if JSON conversion fails.
            // This will happen when users run the new code for the first time
            mapping = new Map<string, string>()
        }

        return mapping
    }

    // static set lastViewId(newValue: Map<string, string> | null) {
    //     UserSettings.set(UserSettingKey.LastViewId, JSON.stringify(newValue))
    // }

    static setLastViewId(boardID: string, viewID: string) {
        const data = this.lastViewId || new Map<string, string>()
        data.set(boardID, viewID)
        UserSettings.set(UserSettingKey.LastBoardId, JSON.stringify(data))
    }

    static get prefillRandomIcons(): boolean {
        return UserSettings.get(UserSettingKey.RandomIcons) !== 'false'
    }

    static set prefillRandomIcons(newValue: boolean) {
        UserSettings.set(UserSettingKey.RandomIcons, JSON.stringify(newValue))
    }

    static get dashboardShowEmpty(): boolean {
        return localStorage.getItem(UserSettingKey.DashboardShowEmpty) !== 'false'
    }

    static set dashboardShowEmpty(newValue: boolean) {
        localStorage.setItem(UserSettingKey.DashboardShowEmpty, JSON.stringify(newValue))
    }

    static getEmojiMartSetting(key: string): any {
        const prefixed = `emoji-mart.${key}`
        Utils.assert((Object as any).values(UserSettingKey).includes(prefixed))
        const json = UserSettings.get(prefixed as UserSettingKey)
        return json ? JSON.parse(json) : null
    }

    static setEmojiMartSetting(key: string, value: any): void {
        const prefixed = `emoji-mart.${key}`
        Utils.assert((Object as any).values(UserSettingKey).includes(prefixed))
        UserSettings.set(prefixed as UserSettingKey, JSON.stringify(value))
    }

    static get mobileWarningClosed(): boolean {
        return UserSettings.get(UserSettingKey.MobileWarningClosed) === 'true'
    }

    static set mobileWarningClosed(newValue: boolean) {
        UserSettings.set(UserSettingKey.MobileWarningClosed, String(newValue))
    }
}

export function exportUserSettingsBlob(): string {
    return window.btoa(exportUserSettings())
}

function exportUserSettings(): string {
    const keys = Object.values(UserSettingKey)
    const settings = Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)]))
    settings.timestamp = `${Date.now()}`
    return JSON.stringify(settings)
}

export function importUserSettingsBlob(blob: string): string[] {
    return importUserSettings(window.atob(blob))
}

function importUserSettings(json: string): string[] {
    const settings = parseUserSettings(json)
    if (!settings) {
        return []
    }
    const timestamp = settings.timestamp
    const lastTimestamp = localStorage.getItem('timestamp')
    if (!timestamp || (lastTimestamp && Number(timestamp) <= Number(lastTimestamp))) {
        return []
    }
    const importedKeys = []
    for (const [key, value] of Object.entries(settings)) {
        if (Object.values(UserSettingKey).includes(key as UserSettingKey)) {
            if (value) {
                localStorage.setItem(key, value as string)
            } else {
                localStorage.removeItem(key)
            }
            importedKeys.push(key)
        }
    }
    return importedKeys
}

function parseUserSettings(json: string): any {
    try {
        return JSON.parse(json)
    } catch (e) {
        return undefined
    }
}
