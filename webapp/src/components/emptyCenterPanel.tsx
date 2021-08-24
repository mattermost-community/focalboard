// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {getTeam} from '../store/teams'
import {useAppSelector} from '../store/hooks'
import './emptyCenterPanel.scss'

const EmptyCenterPanel = React.memo(() => {
    const team = useAppSelector(getTeam)

    return (
        <div className='EmptyCenterPanel'>
            {team && team.id !== '0' &&
            <div className='TeamInfo'>
                <FormattedMessage
                    id='EmptyCenterPanel.team'
                    defaultMessage='This is the team for:'
                />
                <b>
                    {team.title}
                </b>
            </div>
            }
            <div className='Hint'>
                <FormattedMessage
                    id='EmptyCenterPanel.no-content'
                    defaultMessage='Add or select a board from the sidebar to get started.'
                />
            </div>
        </div>
    )
})

export default EmptyCenterPanel
