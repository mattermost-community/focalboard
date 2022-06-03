// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import AlertIcon from '../widgets/icons/alert'

import NotificationBox from '../widgets/notification-box'

type Props = {
    hiddenCardCount: number
    showHiddenCardCountNotification: (show?: boolean) => void
}

const HiddenCardCountNotification = (props: Props) => {
    return (
        <NotificationBox
            title={`${props.hiddenCardCount} cards hidden`}
            icon={<AlertIcon/>}
            onClose={() => props.showHiddenCardCountNotification(false)}
        >
            <FormattedMessage
                id='notification-box.card-limit-reached.text'
                defaultMessage='Card limit reached, to view older cards, {link}'
                values={{
                    link: (
                        <a
                            href='https://mattermost.com/pricing/'
                            target='_blank'
                            rel='noreferrer'
                        >
                            <FormattedMessage
                                id='notification-box-card-limit-reached.link'
                                defaultMessage='Upgrade to a paid plan'
                            />
                        </a>),
                }}
            />
        </NotificationBox>
    )
}

export default HiddenCardCountNotification
