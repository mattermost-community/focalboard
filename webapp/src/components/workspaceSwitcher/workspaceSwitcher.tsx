// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import './workspaceSwitcher.scss'
import {useHistory} from 'react-router-dom'

import {IWorkspace} from '../../blocks/workspace'
import ChevronDown from '../../widgets/icons/chevronDown'
import AddIcon from '../../widgets/icons/add'

import {UserSettings} from '../../userSettings'

import WorkspaceOptions, {DashboardOption} from './workspaceOptions'

type Props = {
    activeWorkspace?: IWorkspace
}

const WorkspaceSwitcher = (props: Props): JSX.Element => {
    const history = useHistory()
    const {activeWorkspace} = props
    const [showMenu, setShowMenu] = useState<boolean>(false)

    const sendUserToEmptyCenterPanel = () => {
        UserSettings.lastBoardId = null
        UserSettings.lastViewId = null
        history.push(`/workspace/${activeWorkspace?.id}`)
    }

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
                <span>{activeWorkspace?.title || DashboardOption.label}</span>
                <ChevronDown/>
            </div>
            {
                showMenu &&
                <WorkspaceOptions
                    activeWorkspaceId={activeWorkspace?.id || DashboardOption.value}
                    onBlur={() => {
                        setShowMenu(false)
                    }}
                    onChange={(workspaceId: string) => {
                        setShowMenu(false)
                        let newPath: string

                        if (workspaceId === DashboardOption.value) {
                            newPath = '/dashboard'
                        } else {
                            newPath = `/workspace/${workspaceId}`
                        }

                        UserSettings.lastWorkspaceId = workspaceId
                        history.push(newPath)
                    }}
                />
            }
            {activeWorkspace &&
                <span
                    className='add-workspace-icon'
                    onClick={sendUserToEmptyCenterPanel}
                >
                    <AddIcon/>
                </span>
            }
        </div>
    )
}

export default WorkspaceSwitcher
