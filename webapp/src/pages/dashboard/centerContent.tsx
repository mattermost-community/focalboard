// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'

import {useHistory} from 'react-router-dom'

import {useIntl} from 'react-intl'

import {UserWorkspace} from '../../user'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {getUserWorkspaceList, setUserWorkspaces} from '../../store/workspace'
import octoClient from '../../octoClient'

import SearchIcon from '../../widgets/icons/search'

const DashboardCenterContent = (): JSX.Element => {
    const rawWorkspaces = useAppSelector<UserWorkspace[]>(getUserWorkspaceList) || []
    const dispatch = useAppDispatch()
    const history = useHistory()
    const intl = useIntl()

    useEffect(() => {
        if (rawWorkspaces.length > 0) {
            console.log('useEffect: rawWorkspaces populated')
            return
        }

        initializeUserWorkspaces()
    })

    const [searchFilter, setSearchFilter] = useState('')

    const initializeUserWorkspaces = async () => {
        const userWorkspaces = await octoClient.getUserWorkspaces()
        dispatch(setUserWorkspaces(userWorkspaces))
    }

    const userWorkspaces = rawWorkspaces.
        filter((workspace) => workspace.title.toLowerCase().includes(searchFilter) || workspace.boardCount.toString().includes(searchFilter)).
        sort((a, b) => {
            if ((a.boardCount === 0 && b.boardCount === 0) || (a.boardCount !== 0 && b.boardCount !== 0)) {
                return a.title.localeCompare(b.title)
            }

            return b.boardCount - a.boardCount
        })

    return (
        <div className='DashboardCenterContent'>
            <div className='DashboardPage__header'>
                <h1 className='h1'>{intl.formatMessage({id: 'DashboardPage.title', defaultMessage: 'Dashboard'})}</h1>
                <div className='DashboardPage__search'>
                    <SearchIcon/>
                    <input
                        type='text'
                        placeholder={intl.formatMessage({id: 'ViewHeader.search', defaultMessage: 'Search'})}
                        onChange={(e) => {
                            setSearchFilter(e.target.value.trim().toLowerCase())
                        }}
                    />
                </div>
            </div>
            <div className='DashboardPage__content'>
                <div className='text-heading3'>{'All Channels'}</div>
                <div className='DashboardPage__workspace-container'>
                    {
                        userWorkspaces.length === 0 &&
                            <div className='emptyResult'>
                                {intl.formatMessage({id: 'DashboardPage.CenterPanel.NoWorkspaces', defaultMessage: 'No channels found'})}
                            </div>
                    }
                    {
                        userWorkspaces.map((workspace) => (
                            <div
                                key={workspace.id}
                                className='DashboardPage__workspace'
                                onClick={() => {
                                    const newPath = `/workspace/${workspace.id}`
                                    history.replace(newPath)
                                }}
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
