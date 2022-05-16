// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useMemo, useCallback, useEffect, useState} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'

import AlertIcon from '../widgets/icons/alert'

import {useAppSelector, useAppDispatch} from '../store/hooks'
import {IUser, UserConfigPatch} from '../user'
import {getMe, patchProps, getCardLimitSnoozeUntil} from '../store/users'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../telemetry/telemetryClient'
import octoClient from '../octoClient'

import NotificationBox from '../widgets/notification-box'
import './cardLimitNotification.scss'

const CardLimitNotification = () => {
    const intl = useIntl()
    const [time, setTime] = useState(Date.now())

    // TODO: Set the number of real hidden cards
    const title = useMemo(() => intl.formatMessage(
        {
            id: 'notification-box-card-limit-reached.title',
            defaultMessage: '{cards} cards hidden from board',
        },
        {cards: 12}
    ), [])
    const me = useAppSelector<IUser|null>(getMe)
    const snoozedUntil = useAppSelector<number>(getCardLimitSnoozeUntil)
    const dispatch = useAppDispatch()

    const isSnoozed = time < snoozedUntil

    useEffect(() => {
        if (isSnoozed) {
            const interval = setInterval(() => setTime(Date.now()), 1000 * 1);
            return () => {
                clearInterval(interval);
            };
        }
    }, [isSnoozed]);

    useEffect(() => {
        if (!isSnoozed) {
            TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.LimitCardLimitReached, {})
        }
    }, [isSnoozed]);

    const onClick = useCallback(() => {
        // TODO: Redirect to the upgrade URL
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.LimitCardLimitLinkOpen, {})
    }, [])

    const onClose = useCallback(async () => {
        if (me) {
            const patch: UserConfigPatch = {
                updatedFields: {
                    focalboard_cardLimitSnoozeUntil: `${Date.now() + (1000*30)}`,
                },
            }

            const patchedProps = await octoClient.patchUserConfig(me.id, patch)
            if (patchedProps) {
                dispatch(patchProps(patchedProps))
            }
        }
    }, [me])

    // TODO: Verify the permission check for the cloud
    const hasPermissionToUpgrade = me?.roles?.indexOf("system_admin") != -1

    if (isSnoozed) {
        return null
    }

    return (
        <NotificationBox
            icon={<AlertIcon/>}
            title={title}
            onClose={onClose}
            closeTooltip={intl.formatMessage({
                id: 'notification-box-card-limit-reached.close-tooltip',
                defaultMessage: 'Snooze for 10 days'
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
