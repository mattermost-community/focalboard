// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'

import {IWorkspace} from '../../blocks/workspace'
import {getActiveThemeName, loadTheme} from '../../theme'
import {WorkspaceTree} from '../../viewModel/workspaceTree'
import IconButton from '../../widgets/buttons/iconButton'
import HamburgerIcon from '../../widgets/icons/hamburger'
import HideSidebarIcon from '../../widgets/icons/hideSidebar'
import ShowSidebarIcon from '../../widgets/icons/showSidebar'

import './sidebar.scss'

import SidebarAddBoardMenu from './sidebarAddBoardMenu'
import SidebarBoardItem from './sidebarBoardItem'
import SidebarSettingsMenu from './sidebarSettingsMenu'
import SidebarUserMenu from './sidebarUserMenu'

type Props = {
    workspace?: IWorkspace
    showBoard: (id?: string) => void
    showView: (id: string, boardId?: string) => void
    workspaceTree: WorkspaceTree,
    activeBoardId?: string
}

const Sidebar = React.memo((props: Props) => {
    const [isHidden, setHidden] = useState(false)
    const [whiteLogo, setWhiteLogo] = useState(false)

    useEffect(() => {
        const theme = loadTheme()
        const newWhiteLogo = theme.sidebarWhiteLogo === 'true'
        if (whiteLogo !== newWhiteLogo) {
            setWhiteLogo(newWhiteLogo)
        }
    }, [])

    const {workspace, workspaceTree} = props
    if (!workspaceTree) {
        return <div/>
    }

    const {boards, views} = workspaceTree

    if (isHidden) {
        return (
            <div className='Sidebar octo-sidebar hidden'>
                <div className='octo-sidebar-header show-button'>
                    <div className='hamburger-icon'>
                        <IconButton
                            icon={<HamburgerIcon/>}
                            onClick={() => setHidden(false)}
                        />
                    </div>
                    <div className='show-icon'>
                        <IconButton
                            icon={<ShowSidebarIcon/>}
                            onClick={() => setHidden(false)}
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='Sidebar octo-sidebar'>
            <div className='octo-sidebar-header'>
                <div className='heading'>
                    <SidebarUserMenu
                        whiteLogo={whiteLogo}
                        showVersionBadge={Boolean(workspace && workspace.id !== '0')}
                    />
                </div>

                <div className='octo-spacer'/>
                <IconButton
                    onClick={() => setHidden(true)}
                    icon={<HideSidebarIcon/>}
                />
            </div>
            {workspace && workspace.id !== '0' &&
                <div className='WorkspaceTitle'>
                    {workspace.title}
                </div>
            }
            <div className='octo-sidebar-list'>
                {
                    boards.map((board) => {
                        const nextBoardId = boards.length > 1 ? boards.find((o) => o.id !== board.id)?.id : undefined
                        return (
                            <SidebarBoardItem
                                key={board.id}
                                views={views}
                                board={board}
                                showBoard={props.showBoard}
                                showView={props.showView}
                                activeBoardId={props.activeBoardId}
                                nextBoardId={nextBoardId}
                            />
                        )
                    })
                }
            </div>

            <div className='octo-spacer'/>

            <SidebarAddBoardMenu
                showBoard={props.showBoard}
                workspaceTree={props.workspaceTree}
                activeBoardId={props.activeBoardId}
            />

            <SidebarSettingsMenu
                setWhiteLogo={(newWhiteLogo: boolean) => setWhiteLogo(newWhiteLogo)}
                activeTheme={getActiveThemeName()}
            />
        </div>
    )
})

export default Sidebar
