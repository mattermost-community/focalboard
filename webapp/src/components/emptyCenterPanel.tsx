// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {IWorkspace} from '../blocks/workspace'
import './emptyCenterPanel.scss'

type Props = {
    workspace?: IWorkspace
    intl: IntlShape
}

const EmptyCenterPanel = React.memo((props: Props) => {
    const {workspace} = props

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

export default injectIntl(EmptyCenterPanel)
