// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {useIntl} from 'react-intl'

import {useAppSelector} from '../../store/hooks'
import {getCurrentBoard} from '../../store/boards'
import {Utils} from '../../utils'

import PrivateIcon from '../../widgets/icons/lockOutline'
import PublicIcon from '../../widgets/icons/globe'

const ChannelPermissionsRow = (): JSX.Element => {
    const intl = useIntl()
    const board = useAppSelector(getCurrentBoard)

    // TODO: get the real channel, meanwhile use a fake one
    const channel = {
        display_name: 'fake channel',
        name: 'fake-channel',
        type: 'P',
    }

    if (!Utils.isFocalboardPlugin() || !board.channelId) {
        return <></>
    }

    return (
        <div className='user-item'>
            <div className='user-item__content'>
                <span className='user-item__img'>
                    {channel.type === 'P' && <PrivateIcon/>}
                    {channel.type === 'O' && <PublicIcon/>}
                </span>
                <div className='ml-3'><strong>{channel.display_name}</strong></div>
            </div>
            <div>
                <span>
                    {intl.formatMessage({id: 'BoardMember.schemeEditor', defaultMessage: 'Editor'})}
                </span>
            </div>
        </div>
    )
}

export default ChannelPermissionsRow
