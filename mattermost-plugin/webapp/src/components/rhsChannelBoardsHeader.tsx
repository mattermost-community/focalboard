// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React  from 'react'

import {getCurrentChannel} from '../../../../webapp/src/store/channels'
import {useAppSelector} from '../../../../webapp/src/store/hooks'

const RHSChannelBoardsHeader = () => {
    const appBarIconURL = (window as any).baseURL + '/public/app-bar-icon.png'
    const currentChannel = useAppSelector(getCurrentChannel);

    if (!currentChannel) {
        return null
    }

    return (
        <div>
            <img
                className='boards-rhs-header-logo'
                src={appBarIconURL}
            />
            <span>{'Boards'}</span>
            <span className='style--none sidebar--right__title__subtitle'>{currentChannel.display_name}</span>
        </div>
    )
}

export default RHSChannelBoardsHeader
