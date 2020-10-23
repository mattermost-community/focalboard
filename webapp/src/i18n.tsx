// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import messages_en from '../i18n/en.json'
import messages_es from '../i18n/es.json'

export function getMessages(lang: string): {[key: string]: string} {
    switch (lang) {
    case 'es':
        return messages_es
    }
    return messages_en
}

export function getCurrentLanguage(): string {
    let lang = localStorage.getItem('language')
    if (!lang) {
        lang = navigator.language.split(/[-_]/)[0]
    }
    return lang
}

export function storeLanguage(lang: string): void {
    localStorage.setItem('language', lang)
}
