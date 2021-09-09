// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect} from 'react'

import {UserWorkspace} from '../../user'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {getUserWorkspaceList, setUserWorkspaces} from '../../store/workspace'
import {initialLoad} from '../../store/initialLoad'
import octoClient from '../../octoClient'

import SearchIcon from '../../widgets/icons/search'

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
            <div className='DashboardPage__header'>
                <h1 className='h1'>{'Dashboard'}</h1>
                <div className='DashboardPage__search'>
                    <SearchIcon/>
                    <input
                        type='text'
                        placeholder='Search'
                    />
                </div>
            </div>
            <div>
                <div className='text-heading3'>{'All Channels'}</div>
                <div className='DashboardPage__workspace-container'>
                    {
                        userWorkspaces.map((workspace) => (
                            <div
                                key={workspace.id}
                                className='DashboardPage__workspace'
                            >
                                <div className='text-heading2'>
                                    {workspace.title}
                                </div>
                                <div className='small'>
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
