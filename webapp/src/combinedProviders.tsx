// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {IntlProvider} from 'react-intl'
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import {TouchBackend} from 'react-dnd-touch-backend'

import {getMessages} from './i18n'
import {SetLanguageContext} from './setLanguageContext'
import {Utils} from './utils'

type Props = {
    language: string
    setLanguage: (lang: string) => void
    children: React.ReactNode
}

const CombinedProviders = React.memo((props: Props): JSX.Element => {
    const {language, setLanguage} = props
    return (
        <IntlProvider
            locale={language.split(/[_]/)[0]}
            messages={getMessages(language)}
        >
            <SetLanguageContext.Provider value={setLanguage}>
                <DndProvider backend={Utils.isMobile() ? TouchBackend : HTML5Backend}>
                    {props.children}
                </DndProvider>
            </SetLanguageContext.Provider>
        </IntlProvider>
    )
})

export default CombinedProviders
