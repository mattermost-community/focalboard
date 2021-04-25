// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const keys = ['language', 'theme', 'lastBoardId', 'lastViewId', 'emoji-mart.last', 'emoji-mart.frequently']

export function exportUserSettings(): string {
    const settings = Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)]))
    settings.timestamp = `${Date.now()}`
    return JSON.stringify(settings)
}

export function importUserSettings(json: string): boolean {
    const settings = parseUserSettings(json)
    const timestamp = settings.timestamp
    const lastTimestamp = localStorage.getItem('timestamp')
    if (!timestamp || (lastTimestamp && Number(timestamp) <= Number(lastTimestamp))) {
        return false
    }
    for (const [key, value] of Object.entries(settings)) {
        localStorage.setItem(key, value as string)
    }
    location.reload()
    return true
}

function parseUserSettings(json: string): any {
    try {
        return JSON.parse(json)
    } catch (e) {
        return {}
    }
}
