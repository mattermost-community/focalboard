// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import './workspaceSwitcher.scss'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {IWorkspace} from '../../blocks/workspace'
import ChevronDown from '../../widgets/icons/chevronDown'

import WorkspaceOptions, {DashboardOption} from './workspaceOptions'

type Props = {
    activeWorkspace?: IWorkspace
}

const WorkspaceSwitcher = (props: Props): JSX.Element => {
    const history = useHistory()
    const match = useRouteMatch()

    const [showMenu, setShowMenu] = useState<boolean>(false)

    return (
        <div className={'WorkspaceSwitcherWrapper'}>
            <div
                className='WorkspaceSwitcher'
                onClick={() => {
                    if (!showMenu) {
                        setShowMenu(true)
                    }
                }}
            >
                <span>{props.activeWorkspace?.title || DashboardOption.label}</span>
                <ChevronDown/>
            </div>
            {
                showMenu &&
                <WorkspaceOptions
                    activeWorkspaceId={props.activeWorkspace?.id || DashboardOption.value}
                    onBlur={() => {
                        setShowMenu(false)
                    }}
                    onChange={(workspaceId: string) => {
                        setShowMenu(false)
                        let newPath: string

                        if (workspaceId === DashboardOption.value) {
                            newPath = '/dashboard'
                        } else if (props.activeWorkspace === undefined) {
                            newPath = `/workspace/${workspaceId}`
                        } else {
                            newPath = generatePath(match.path, {workspaceId})
                        }

                        history.push(newPath)
                    }}
                />
            }
        </div>
    )
}

export default WorkspaceSwitcher
