// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {useIntl} from 'react-intl'

import Button from '../../widgets/buttons/button'

import {Card} from '../../blocks/card'
import './hiddenCardCount.scss'

type Props = {
    hiddenCards: Card[]
}

const HiddenCardCount = (props: Props): JSX.Element => {
    const intl = useIntl()
    return (
        <div className='HiddenCardCount'>
            <div className='hidden-card-title'>{intl.formatMessage({id: 'limitedCard.title', defaultMessage: 'Cards Hidden'})}</div>
            <Button title='hidden-card-count'>{props.hiddenCards.length}</Button>
        </div>
    )
}

export default HiddenCardCount
