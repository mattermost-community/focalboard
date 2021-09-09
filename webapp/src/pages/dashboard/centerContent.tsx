// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect} from 'react'

import {UserWorkspace} from '../../user'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {getUserWorkspaceList, setUserWorkspaces} from '../../store/workspace'
import {initialLoad} from '../../store/initialLoad'
import octoClient from '../../octoClient'

const DashboardCenterContent = (): JSX.Element => {
    const rawWorkspaces = useAppSelector<UserWorkspace[]>(getUserWorkspaceList) || []
    const dispatch = useAppDispatch()

    useEffect(() => {
        if (rawWorkspaces.length > 0) {
            console.log('useEffect: rawWorkspaces populated')
            return
        }

        // console.log('useEffect: rawWorkspaces NOT populated')
        // dispatch(initialLoad())

        foo()
    })

    const foo = async () => {
        const userWorkspaces = await octoClient.getUserWorkspaces()
        dispatch(setUserWorkspaces(userWorkspaces))
    }

    const userWorkspaces = rawWorkspaces.map((workspace) => workspace). // Array received from selected is froozed. This unfreezes it to allow in-place sorting.
        sort((a, b) => {
            if ((a.boardCount === 0 && b.boardCount === 0) || (a.boardCount !== 0 && b.boardCount !== 0)) {
                return a.title.localeCompare(b.title)
            }

            return b.boardCount - a.boardCount
        })

    return (
        <div className='DashboardCenterContent'>
            <div>
                <div>{'All Channels'}</div>
                <div>
                    {
                        userWorkspaces.map((workspace) => (
                            <div
                                key={workspace.id}
                                className='workspace'
                            >
                                <div className='workspaceName'>
                                    {workspace.title}
                                </div>
                                <div className='boardCount'>
                                    {`${workspace.boardCount} board${workspace.boardCount > 1 ? 's' : ''}`}
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}

export default DashboardCenterContent
