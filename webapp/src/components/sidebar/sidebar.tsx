// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'

import {loadTheme} from '../../theme'
import {WorkspaceTree} from '../../viewModel/workspaceTree'
import IconButton from '../../widgets/buttons/iconButton'
import HamburgerIcon from '../../widgets/icons/hamburger'
import HideSidebarIcon from '../../widgets/icons/hideSidebar'
import ShowSidebarIcon from '../../widgets/icons/showSidebar'

import SidebarSettingsMenu from './sidebarSettingsMenu'
import SidebarAddBoardMenu from './sidebarAddBoardMenu'
import SidebarBoardItem from './sidebarBoardItem'
import SidebarUserMenu from './sidebarUserMenu'
import './sidebar.scss'

type Props = {
    showBoard: (id?: string) => void
    showView: (id: string, boardId?: string) => void
    workspaceTree: WorkspaceTree,
    activeBoardId?: string
    setLanguage: (lang: string) => void,
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

    const {workspaceTree} = props
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
                    <SidebarUserMenu whiteLogo={whiteLogo}/>
                </div>

                <div className='octo-spacer'/>
                <IconButton
                    onClick={() => setHidden(true)}
                    icon={<HideSidebarIcon/>}
                />
            </div>
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
                setLanguage={props.setLanguage}
                setWhiteLogo={(newWhiteLogo: boolean) => setWhiteLogo(newWhiteLogo)}
            />
        </div>
    )
})

export default Sidebar
