// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useMemo, useCallback, useEffect, useState} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'

import AlertIcon from '../widgets/icons/alert'

import {useAppSelector, useAppDispatch} from '../store/hooks'
import {IUser, UserConfigPatch} from '../user'
import {getMe, patchProps, getCardLimitSnoozeUntil} from '../store/users'
import {getHiddenByLimitCards} from '../store/cards'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../telemetry/telemetryClient'
import octoClient from '../octoClient'

import NotificationBox from '../widgets/notification-box'
import './cardLimitNotification.scss'

const snoozeTime = 1000 * 60 * 60 * 24 * 10
const checkSnoozeInterval = 1000 * 60 * 5

const CardLimitNotification = () => {
    const intl = useIntl()
    const [time, setTime] = useState(Date.now())

    const hiddenCards = useAppSelector<number>(getHiddenByLimitCards)
    const title = useMemo(() => intl.formatMessage(
        {
            id: 'notification-box-card-limit-reached.title',
            defaultMessage: '{cards} cards hidden from board',
        },
        {cards: hiddenCards},
    ), [])
    const me = useAppSelector<IUser|null>(getMe)
    const snoozedUntil = useAppSelector<number>(getCardLimitSnoozeUntil)
    const dispatch = useAppDispatch()

    const isSnoozed = time < snoozedUntil

    useEffect(() => {
        if (isSnoozed) {
            const interval = setInterval(() => setTime(Date.now()), checkSnoozeInterval)
            return () => {
                clearInterval(interval)
            }
        }
        return () => null
    }, [isSnoozed])

    useEffect(() => {
        if (!isSnoozed) {
            TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.LimitCardLimitReached, {})
        }
    }, [isSnoozed])

    const onClick = useCallback(() => {
        // TODO: Show the modal to upgrade
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.LimitCardLimitLinkOpen, {})
    }, [])

    const onClose = useCallback(async () => {
        if (me) {
            const patch: UserConfigPatch = {
                updatedFields: {
                    focalboard_cardLimitSnoozeUntil: `${Date.now() + snoozeTime}`,
                },
            }

            const patchedProps = await octoClient.patchUserConfig(me.id, patch)
            if (patchedProps) {
                dispatch(patchProps(patchedProps))
            }
        }
    }, [me])

    const hasPermissionToUpgrade = me?.roles?.split(' ').indexOf('system_admin') !== -1

    if (isSnoozed || hiddenCards === 0) {
        return null
    }

    return (
        <NotificationBox
            icon={<AlertIcon/>}
            title={title}
            onClose={onClose}
            closeTooltip={intl.formatMessage({
                id: 'notification-box-card-limit-reached.close-tooltip',
                defaultMessage: 'Snooze for 10 days',
            })}
        >
            {hasPermissionToUpgrade &&
                <FormattedMessage
                    id='notification-box.card-limit-reached.text'
                    defaultMessage='Card limit reached, to view older cards, {link}'
                    values={{
                        link: (
                            <a
                                onClick={onClick}
                            >
                                <FormattedMessage
                                    id='notification-box-card-limit-reached.link'
                                    defaultMessage='upgrade to a paid plan'
                                />
                            </a>),
                    }}
                />}
            {!hasPermissionToUpgrade &&
                <FormattedMessage
                    id='notification-box.card-limit-reached.not-admin.text'
                    defaultMessage='To access archived cards, contact your admin to upgrade to a paid plan.'
                />}
        </NotificationBox>
    )
}

export default React.memo(CardLimitNotification)
