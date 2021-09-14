// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import './workspaceSwitcher.scss'
import {useHistory} from 'react-router-dom'

import {IWorkspace} from '../../blocks/workspace'
import ChevronDown from '../../widgets/icons/chevronDown'

import {UserSettings} from '../../userSettings'

import WorkspaceOptions from './workspaceOptions'

type Props = {
    activeWorkspace: IWorkspace
}

const WorkspaceSwitcher = (props: Props): JSX.Element => {
    const history = useHistory()

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
                <span>{props.activeWorkspace.title}</span>
                <ChevronDown/>
            </div>
            {
                showMenu &&
                <WorkspaceOptions
                    activeWorkspaceId={props.activeWorkspace.id}
                    onBlur={() => {
                        setShowMenu(false)
                    }}
                    onChange={(workspaceId: string) => {
                        setShowMenu(false)
                        const newPath = `/workspace/${workspaceId}`
                        UserSettings.lastWorkspaceId = workspaceId
                        history.push(newPath)
                    }}
                />
            }
        </div>
    )
}

export default WorkspaceSwitcher
