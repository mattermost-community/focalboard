// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import './workspaceSwitcher.scss'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {IWorkspace} from '../../blocks/workspace'
import ChevronDown from '../../widgets/icons/chevronDown'

import {UserSettings} from '../../userSettings'

import WorkspaceOptions from './workspaceOptions'

type Props = {
    activeWorkspace: IWorkspace
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
                        const newPath = generatePath(match.path, {workspaceId})

                        console.log('newPath:  ' + newPath)
                        UserSettings.lastWorkspaceId = workspaceId

                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        window.WebappUtils.browserHistory.push(newPath)

                        // window.postMessage(
                        //     {
                        //         type: 'browser-history-push',
                        //         message: {
                        //             path: newPath,
                        //         },
                        //     },
                        //     window.location.origin,
                        // )

                        history.replace(newPath)
                    }}
                />
            }
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.addEventListener('message', ({origin, data: {type, message = {}} = {}} = {}) => {
    if (origin !== window.location.origin) {
        return
    }

    console.log('message received: ' + JSON.stringify(origin))
})

export default WorkspaceSwitcher
