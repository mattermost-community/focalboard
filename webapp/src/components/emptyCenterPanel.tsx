// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {getCurrentWorkspace} from '../store/workspace'
import {useAppSelector} from '../store/hooks'
import {Utils} from '../utils'
import {Board} from '../blocks/board'
import {getGlobalTemplates} from '../store/globalTemplates'
import {getSortedTemplates} from '../store/boards'
import './emptyCenterPanel.scss'

const EmptyCenterPanelButton = React.memo(() => {
    return <span> hi </span>
})

const EmptyCenterPanel = React.memo(() => {
    // const workspace = useAppSelector(getCurrentWorkspace)
    const templates = useAppSelector(getSortedTemplates)
    const globalTemplates = useAppSelector<Board[]>(getGlobalTemplates)

    console.log(templates)
    console.log(globalTemplates)

    const workspace: any = {}
    workspace.title = 'Town Square'

    let contentDisplay = (
        <div className='Hint'>
            <FormattedMessage
                id='EmptyCenterPanel.no-content'
                defaultMessage='Add or select a board from the sidebar to get started.'
            />
        </div>
    )

    if (!Utils.isFocalboardPlugin()) {
        contentDisplay = (
            <div className='content'>
                <span>
                    <FormattedMessage
                        id='EmptyCenterPanel.plugin.no-content-title'
                        defaultMessage='Create a Board in {workspaceName}'
                        values={{workspaceName: workspace?.title}}
                    />
                </span>
                <br/>
                <FormattedMessage
                    id='EmptyCenterPanel.plugin.no-content-description'
                    defaultMessage='Add a board to the sidebar using any of the templates defined below or start from scratch.{lineBreak} Members of "{workspaceName}" will have access to boards created here.'
                    values={{
                        workspaceName: <b>{workspace?.title}</b>,
                        lineBreak: <br/>,
                    }}
                />
                <br/>
                <FormattedMessage
                    id='EmptyCenterPanel.plugin.choose-a-template'
                    defaultMessage='Choose a template'
                />
                {templates.map((template) =>
                    <EmptyCenterPanelButton key={template.id}/>,
                )}
            </div>
        )
    }

    return (
        <div className='EmptyCenterPanel'>
            {contentDisplay}
        </div>
    )
})

export default EmptyCenterPanel
