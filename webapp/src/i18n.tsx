// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import messages_en from '../i18n/en.json'
import messages_es from '../i18n/es.json'
import messages_de from '../i18n/de.json'
import messages_ja from '../i18n/ja.json'
import messages_fr from '../i18n/fr.json'
import messages_nl from '../i18n/nl.json'
import messages_ru from '../i18n/ru.json'
import messages_oc from '../i18n/oc.json'
import messages_tr from '../i18n/tr.json'
import messages_zhHant from '../i18n/zh_Hant.json'

export function getMessages(lang: string): {[key: string]: string} {
    switch (lang) {
    case 'de':
        return messages_de
    case 'fr':
        return messages_fr
    case 'ja':
        return messages_ja
    case 'nl':
        return messages_nl
    case 'ru':
        return messages_ru
    case 'es':
        return messages_es
    case 'oc':
        return messages_oc
    case 'tr':
        return messages_tr
    case 'zh':
        return messages_zhHant
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
