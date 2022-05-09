// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {useIntl, FormattedMessage} from 'react-intl'

import {Utils} from '../../utils'
import IconButton from '../../widgets/buttons/iconButton'
import Button from '../../widgets/buttons/button'

import CloseIcon from '../../widgets/icons/close'

import {useAppSelector, useAppDispatch} from '../../store/hooks'
import octoClient from '../../octoClient'
import {IUser, UserConfigPatch} from '../../user'
import {getMe, patchProps, getCloudMessageCanceled} from '../../store/users'

import CompassIcon from '../../widgets/icons/compassIcon'
import TelemetryClient, {TelemetryCategory, TelemetryActions} from '../../telemetry/telemetryClient'

import './cloudMessage.scss'
const signupURL = 'https://mattermost.com/pricing'
const displayAfter = (1000 * 60 * 60 * 24) //24 hours

const CloudMessage = React.memo(() => {
    const intl = useIntl()
    const dispatch = useAppDispatch()
    const me = useAppSelector<IUser|null>(getMe)
    const cloudMessageCanceled = useAppSelector(getCloudMessageCanceled)

    const closeDialogText = intl.formatMessage({
        id: 'Dialog.closeDialog',
        defaultMessage: 'Close dialog',
    })

    const onClose = async () => {
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

    if (Utils.isFocalboardPlugin() || cloudMessageCanceled) {
        return null
    }

    if (me) {
        const installTime = Date.now() - me.create_at
        if (installTime < displayAfter) {
            return null
        }
    }

    return (
        <div className='CloudMessage'>
            <div className='banner'>
                <CompassIcon
                    icon='information-outline'
                    className='CompassIcon'
                />
                <FormattedMessage
                    id='CloudMessage.cloud-server'
                    defaultMessage='Get your own free cloud server.'
                />

                <Button
                    title='Learn more'
                    size='xsmall'
                    emphasis='primary'
                    onClick={() => {
                        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CloudMoreInfo)
                        window.open(signupURL)
                    }}
                >
                    <FormattedMessage
                        id='cloudMessage.learn-more'
                        defaultMessage='Learn more'
                    />
                </Button>

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
