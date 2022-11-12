// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useContext}  from 'react'
import {FormattedMessage, IntlProvider} from 'react-intl'

import isPagesContext from '../../../../webapp/src/isPages'
import {getMessages} from '../../../../webapp/src/i18n'
import {getLanguage} from '../../../../webapp/src/store/language'
import {getCurrentChannel} from '../../../../webapp/src/store/channels'
import {useAppSelector} from '../../../../webapp/src/store/hooks'
import {Utils} from '../../../../webapp/src/utils'

import appBarIcon from '../../../../webapp/static/app-bar-icon.png'
import appBarIconPages from '../../../../webapp/static/app-bar-pages-icon.png'

const RHSChannelBoardsHeader = () => {
    const currentChannel = useAppSelector(getCurrentChannel)
    const language = useAppSelector<string>(getLanguage)
    const isPages = useContext(isPagesContext)

    if (!currentChannel) {
        return null
    }

    return (
        <IntlProvider
            locale={language.split(/[_]/)[0]}
            messages={getMessages(language)}
        >
            <div>
                {isPages &&
                    <img
                        className='boards-rhs-header-logo'
                        src={Utils.buildURL(appBarIconPages, true)}
                    />}
                {!isPages &&
                    <img
                        className='boards-rhs-header-logo'
                        src={Utils.buildURL(appBarIcon, true)}
                    />}
                {isPages &&
                    <span>
                        <FormattedMessage
                            id='rhs-channel-boards-header.pages-title'
                            defaultMessage='Pages'
                        />
                    </span>}
                {!isPages &&
                    <span>
                        <FormattedMessage
                            id='rhs-channel-boards-header.title'
                            defaultMessage='Boards'
                        />
                    </span>}
                <span className='style--none sidebar--right__title__subtitle'>{currentChannel.display_name}</span>
            </div>
        </IntlProvider>
    )
}

export default RHSChannelBoardsHeader
