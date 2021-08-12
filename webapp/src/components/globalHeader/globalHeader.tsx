// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
//
import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {IntlProvider} from 'react-intl'

import HelpIcon from '../../widgets/icons/help'
import store from '../../store'
import {useAppSelector} from '../../store/hooks'
import {getLanguage} from '../../store/language'
import {getMessages} from '../../i18n'

import GlobalHeaderSettingsMenu from './globalHeaderSettingsMenu'

import './globalHeader.scss'

const HeaderItems = () => {
    const language = useAppSelector<string>(getLanguage)
    return (
        <IntlProvider
            locale={language.split(/[_]/)[0]}
            messages={getMessages(language)}
        >
            <div className='GlobalHeaderComponent'>
                <span className='spacer'/>
                <a
                    href='https://www.focalboard.com/guide/user?utm_source=webapp'
                    target='_blank'
                    rel='noreferrer'
                    className='help-button'
                >
                    <HelpIcon/>
                </a>
                <GlobalHeaderSettingsMenu/>
            </div>
        </IntlProvider>
    )
}

const GlobalHeader = () => {
    return (
        <ReduxProvider store={store}>
            <HeaderItems/>
        </ReduxProvider>
    )
}

export default GlobalHeader
