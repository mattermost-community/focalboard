// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export class UserSettings {
    static get prefillRandomIcons(): boolean {
        return localStorage.getItem('randomIcons') !== 'false'
    }

    static set prefillRandomIcons(newValue: boolean) {
        localStorage.setItem('randomIcons', JSON.stringify(newValue))
    }

    static get lastWorkspaceId(): string | null {
        return localStorage.getItem('lastWorkspaceId')
    }

    static set lastWorkspaceId(newValue: string | null) {
        if (newValue === null) {
            localStorage.removeItem('lastWorkspaceId')
        } else {
            localStorage.setItem('lastWorkspaceId', newValue)
        }
    }

    static get welcomePageViewed(): string | null {
        return localStorage.getItem('welcomePageViewed')
    }

    static set welcomePageViewed(newValue: string | null) {
        if (newValue === null) {
            localStorage.removeItem('welcomePageViewed')
        } else {
            localStorage.setItem('welcomePageViewed', newValue)
        }
    }
}

const keys = ['language', 'theme', 'lastBoardId', 'lastViewId', 'emoji-mart.last', 'emoji-mart.frequently', 'randomIcons']

export function exportUserSettingsBlob(): string {
    return window.btoa(exportUserSettings())
}

function exportUserSettings(): string {
    const settings = Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)]))
    settings.timestamp = `${Date.now()}`
    return JSON.stringify(settings)
}

export function importUserSettingsBlob(blob: string): boolean {
    return importUserSettings(window.atob(blob))
}

function importUserSettings(json: string): boolean {
    const settings = parseUserSettings(json)
    const timestamp = settings.timestamp
    const lastTimestamp = localStorage.getItem('timestamp')
    if (!timestamp || (lastTimestamp && Number(timestamp) <= Number(lastTimestamp))) {
        return false
    }
    for (const [key, value] of Object.entries(settings)) {
        if (value) {
            localStorage.setItem(key, value as string)
        } else {
            localStorage.removeItem(key)
        }
    }
    return true
}

function parseUserSettings(json: string): any {
    try {
        return JSON.parse(json)
    } catch (e) {
        return {}
    }
}
