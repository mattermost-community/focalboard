// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import './workspaceSwitcher.scss'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {IWorkspace} from '../../blocks/workspace'
import ChevronDown from '../../widgets/icons/chevronDown'

import WorkspaceOptions from './workspaceOptions'

type Props = {
    activeWorkspace: IWorkspace
}

const WorkspaceSwitcher = (props: Props): JSX.Element => {
    const history = useHistory()
    const match = useRouteMatch()

    const [showMenu, setShowMenu] = useState<boolean>(false)
    const [selectClosed, setSelectClosed] = useState<boolean>(false)

    return (
        <div className={'WorkspaceSwitcherWrapper'}>
            <div
                className='WorkspaceSwitcher'
                onClick={() => {
                    if (selectClosed) {
                        setSelectClosed(false)
                        setShowMenu(false)
                    } else {
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
                    onClose={() => {
                        setSelectClosed(true)
                    }}
                    onChange={(workspaceId: string) => {
                        const newPath = generatePath(match.path, {...match.params, workspaceId})
                        setSelectClosed(false)
                        setShowMenu(false)
                        history.replace(newPath)
                    }}
                />
            }
        </div>
    )
}

export default WorkspaceSwitcher
