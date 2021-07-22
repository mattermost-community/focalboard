// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {getWorkspace} from '../store/workspace'
import {useAppSelector} from '../store/hooks'
import './emptyCenterPanel.scss'

const EmptyCenterPanel = React.memo(() => {
    const workspace = useAppSelector(getWorkspace)

    return (
        <div className='EmptyCenterPanel'>
            {workspace && workspace.id !== '0' &&
            <div className='WorkspaceInfo'>
                <FormattedMessage
                    id='EmptyCenterPanel.workspace'
                    defaultMessage='This is the workspace for:'
                />
                <b>
                    {workspace.title}
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
