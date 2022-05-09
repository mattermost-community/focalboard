// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {useIntl, FormattedMessage} from 'react-intl'

import {getCloudMessageCanceled} from '../../store/users'
import {Utils} from '../../utils'
import IconButton from '../../widgets/buttons/iconButton'
import CloseIcon from '../../widgets/icons/close'
import {useAppSelector, useAppDispatch} from '../../store/hooks'
import octoClient from '../../octoClient'
import {IUser, UserConfigPatch} from '../../user'
import {getMe, patchProps} from '../../store/users'

import './cloudMessage.scss'

const CloudMessage = React.memo(() => {
    const intl = useIntl()
    const dispatch = useAppDispatch()
    const me = useAppSelector<IUser|null>(getMe)
    const cloudMessageCanceled = useAppSelector(getCloudMessageCanceled)

    const closeDialogText = intl.formatMessage({
        id: 'Dialog.closeDialog',
        defaultMessage: 'Close dialog',
    })

    const onClose = async() => {
        if (me) {
            const patch: UserConfigPatch = {
                updatedFields: {
                    focalboard_cloudMessageCanceled: 'true',
                },
            }

            const patchedProps = await octoClient.patchUserConfig(me.id, patch)
            if (patchedProps) {
                dispatch(patchProps(patchedProps))
            }
        }
    }

    if( Utils.isFocalboardPlugin() || cloudMessageCanceled){
        return null
    }

    return (
        <div className='CloudMessage'>
            <div className='banner'>
                <FormattedMessage
                    id='CloudMessage.cloud-server'
                    defaultMessage="Get your own free cloud server."
                />
                <a
                    className='link'
                    href={'https://customers.mattermost.com/cloud/signup'}
                    target='_blank'
                    rel='noreferrer'
                >
                    <FormattedMessage
                        id='cloudMessage.learn-more'
                        defaultMessage='[Learn more].'
                    />
                </a>
            </div>

            <IconButton
                className='margin-right'
                onClick={onClose}
                icon={<CloseIcon/>}
                title={closeDialogText}
                size='small'
            />
        </div>
    )
})
export default CloudMessage
