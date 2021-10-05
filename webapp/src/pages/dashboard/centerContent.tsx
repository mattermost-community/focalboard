// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'

import {useHistory} from 'react-router-dom'

import {FormattedMessage, useIntl} from 'react-intl'

import SearchIllustration from '../../svg/search-illustration'

import {UserWorkspace} from '../../user'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {getUserWorkspaceList, setUserWorkspaces} from '../../store/workspace'
import octoClient from '../../octoClient'
import Switch from '../../widgets/switch'

import SearchIcon from '../../widgets/icons/search'
import {UserSettings} from '../../userSettings'

const DashboardCenterContent = (): JSX.Element => {
    const rawWorkspaces = useAppSelector<UserWorkspace[]>(getUserWorkspaceList) || []
    const dispatch = useAppDispatch()
    const history = useHistory()
    const intl = useIntl()
    const [searchFilter, setSearchFilter] = useState('')
    const [showEmptyWorkspaces, setShowEmptyWorkspaces] = useState(UserSettings.dashboardShowEmpty)

    const initializeUserWorkspaces = async () => {
        const userWorkspaces = await octoClient.getUserWorkspaces()
        dispatch(setUserWorkspaces(userWorkspaces))
    }

    useEffect(() => {
        if (rawWorkspaces.length > 0) {
            return
        }

        initializeUserWorkspaces()
    })

    const userWorkspaces = rawWorkspaces.
        filter((workspace) => (workspace.boardCount > 0 || showEmptyWorkspaces) && (workspace.title.toLowerCase().includes(searchFilter) || workspace.boardCount.toString().includes(searchFilter))).
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
                <div className='DashboardPage__showEmpty'>
                    {intl.formatMessage({id: 'DashboardPage.showEmpty', defaultMessage: 'Show empty'})}
                    <Switch
                        isOn={showEmptyWorkspaces}
                        onChanged={() => {
                            UserSettings.dashboardShowEmpty = !showEmptyWorkspaces
                            setShowEmptyWorkspaces(!showEmptyWorkspaces)
                        }}
                    />
                </div>
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
                {
                    userWorkspaces.length !== 0 &&
                    <div className='text-heading3'>{'All Channels'}</div>
                }
                <div className='DashboardPage__workspace-container'>
                    {
                        userWorkspaces.length === 0 &&
                            <div className='DashboardPage__emptyResult'>
                                <SearchIllustration/>
                                <h3>{intl.formatMessage({id: 'DashboardPage.CenterPanel.NoWorkspaces', defaultMessage: 'Sorry, we could not find any channels matching that term'})}</h3>
                                <p className='small'>{intl.formatMessage({id: 'DashboardPage.CenterPanel.NoWorkspacesDescription', defaultMessage: 'Please try searching for another term'})}</p>
                            </div>
                    }
                    {
                        userWorkspaces.map((workspace) => (
                            <div
                                key={workspace.id}
                                className='DashboardPage__workspace'
                                onClick={() => {
                                    history.push(`/workspace/${workspace.id}`)
                                }}
                            >
                                <div className='text-heading2'>
                                    {workspace.title}
                                </div>
                                <div className='small'>
                                    <FormattedMessage
                                        values={{count: workspace.boardCount}}
                                        id='General.BoardCount'
                                        defaultMessage='{count, plural, one {# Board} other {# Boards}}'
                                    />
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
