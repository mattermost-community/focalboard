// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {TelemetryActions} from './telemetry/telemetryClient'

class Constants {
    static readonly menuColors: {[key: string]: string} = {
        propColorDefault: 'Default',
        propColorGray: 'Gray',
        propColorBrown: 'Brown',
        propColorOrange: 'Orange',
        propColorYellow: 'Yellow',
        propColorGreen: 'Green',
        propColorBlue: 'Blue',
        propColorPurple: 'Purple',
        propColorPink: 'Pink',
        propColorRed: 'Red',
    }

    static readonly minColumnWidth = 100
    static readonly defaultTitleColumnWidth = 280
    static readonly titleColumnId = '__title'
    static readonly badgesColumnId = '__badges'

    static readonly versionString = '0.16.0'
    static readonly versionDisplayString = 'Apr 2022'

    static readonly archiveHelpPage = 'https://docs.mattermost.com/boards/data-and-archives.html'
    static readonly imports = [
        {
            id: 'trello',
            displayName: 'Trello',
            telemetryName: TelemetryActions.ImportTrello,
            href: Constants.archiveHelpPage + '#import-from-trello',
        },
        {
            id: 'asana',
            displayName: 'Asana',
            telemetryName: TelemetryActions.ImportAsana,
            href: Constants.archiveHelpPage + '#import-from-asana',
        },
        {
            id: 'notion',
            displayName: 'Notion',
            telemetryName: TelemetryActions.ImportNotion,
            href: Constants.archiveHelpPage + '#import-from-notion',
        },
        {
            id: 'jira',
            displayName: 'Jira',
            telemetryName: TelemetryActions.ImportJira,
            href: Constants.archiveHelpPage + '#import-from-jira',
        },
        {
            id: 'todoist',
            displayName: 'Todoist',
            telemetryName: TelemetryActions.ImportTodoist,
            href: Constants.archiveHelpPage + '#import-from-todoist',
        },
    ]

    static readonly languages = [
        {
            code: 'en',
            name: 'english',
            displayName: 'English',
        },
        {
            code: 'es',
            name: 'spanish',
            displayName: 'Español',
        },
        {
            code: 'de',
            name: 'german',
            displayName: 'Deutsch',
        },
        {
            code: 'ja',
            name: 'japanese',
            displayName: '日本語',
        },
        {
            code: 'fr',
            name: 'french',
            displayName: 'Français',
        },
        {
            code: 'nl',
            name: 'dutch',
            displayName: 'Nederlands',
        },
        {
            code: 'ru',
            name: 'russian',
            displayName: 'Pусский',
        },
        {
            code: 'zh-cn',
            name: 'chinese',
            displayName: '中文 (繁體)',
        },
        {
            code: 'zh-tw',
            name: 'simplified-chinese',
            displayName: '中文 (简体)',
        },
        {
            code: 'tr',
            name: 'turkish',
            displayName: 'Türkçe',
        },
        {
            code: 'oc',
            name: 'occitan',
            displayName: 'Occitan',
        },
        {
            code: 'pt_BR',
            name: 'portuguese',
            displayName: 'Português (Brasil)',
        },
        {
            code: 'ca',
            name: 'catalan',
            displayName: 'Català',
        },
        {
            code: 'el',
            name: 'greek',
            displayName: 'Ελληνικά',
        },
        {
            code: 'id',
            name: 'indonesian',
            displayName: 'bahasa Indonesia',
        },
        {
            code: 'it',
            name: 'italian',
            displayName: 'Italiano',
        },
        {
            code: 'sv',
            name: 'swedish',
            displayName: 'Svenska',
        },
    ]
}

export {Constants}
