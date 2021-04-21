// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class UserSettings {
    static get prefillRandomIcons(): boolean {
        return localStorage.getItem('randomIcons') !== 'false'
    }

    static set prefillRandomIcons(newValue: boolean) {
        localStorage.setItem('randomIcons', JSON.stringify(newValue))
    }
}

export {UserSettings}
