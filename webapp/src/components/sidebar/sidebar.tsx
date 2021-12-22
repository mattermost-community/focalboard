// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'

import {getActiveThemeName, loadTheme} from '../../theme'
import IconButton from '../../widgets/buttons/iconButton'
import HamburgerIcon from '../../widgets/icons/hamburger'
import HideSidebarIcon from '../../widgets/icons/hideSidebar'
import ShowSidebarIcon from '../../widgets/icons/showSidebar'
import {getSortedBoards} from '../../store/boards'
import {getCurrentWorkspace} from '../../store/workspace'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {Utils} from '../../utils'

import './sidebar.scss'

import {
    BlockCategoryWebsocketData,
    Category,
    CategoryBlocks,
    fetchSidebarCategories,
    getSidebarCategories, updateBlockCategories,
    updateCategories,
} from '../../store/sidebar'

import BoardsSwitcher from '../boardsSwitcher/boardsSwitcher'

import wsClient, {WSClient} from '../../wsclient'

import SidebarAddBoardMenu from './sidebarAddBoardMenu'
import SidebarBoardItem from './sidebarBoardItem'
import SidebarSettingsMenu from './sidebarSettingsMenu'
import SidebarUserMenu from './sidebarUserMenu'
import {addMissingBlocks} from './utils'

type Props = {
    activeBoardId?: string
    isDashboard?: boolean
}

function getWindowDimensions() {
    const {innerWidth: width, innerHeight: height} = window
    return {
        width,
        height,
    }
}

const Sidebar = React.memo((props: Props) => {
    const [isHidden, setHidden] = useState(false)
    const [userHidden, setUserHidden] = useState(false)
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions())
    const boards = useAppSelector(getSortedBoards)
    const dispatch = useAppDispatch()
    const partialCategories = useAppSelector<Array<CategoryBlocks>>(getSidebarCategories)
    const sidebarCategories = addMissingBlocks(partialCategories, boards)

    useEffect(() => {
        wsClient.addOnChange((_: WSClient, categories: Category[]) => {
            dispatch(updateCategories(categories))
        }, 'category')

        wsClient.addOnChange((_: WSClient, blockCategories: Array<BlockCategoryWebsocketData>) => {
            dispatch(updateBlockCategories(blockCategories))
        }, 'blockCategories')
    }, [])

    // TODO un-hardcode this teamID
    const teamID = 'atjjg8ofqb8kjnwy15yhezdgoh'

    useEffect(() => {
        dispatch(fetchSidebarCategories(teamID))
    }, [])

    useEffect(() => {
        loadTheme()
    }, [])

    useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions())
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        hideSidebar()
    }, [windowDimensions])

    const workspace = useAppSelector(getCurrentWorkspace)
    if (!boards) {
        return <div/>
    }

    const hideSidebar = () => {
        if (!userHidden) {
            if (windowDimensions.width < 768) {
                setHidden(true)
            } else {
                setHidden(false)
            }
        }
    }

    if (isHidden) {
        return (
            <div className='Sidebar octo-sidebar hidden'>
                <div className='octo-sidebar-header show-button'>
                    <div className='hamburger-icon'>
                        <IconButton
                            icon={<HamburgerIcon/>}
                            onClick={() => {
                                setUserHidden(false)
                                setHidden(false)
                            }}
                        />
                    </div>
                    <div className='show-icon'>
                        <IconButton
                            icon={<ShowSidebarIcon/>}
                            onClick={() => {
                                setUserHidden(false)
                                setHidden(false)
                            }}
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='Sidebar octo-sidebar'>
            {!Utils.isFocalboardPlugin() &&
                <div className='octo-sidebar-header'>
                    <div className='heading'>
                        <SidebarUserMenu/>
                    </div>

                    <div className='octo-spacer'/>
                    <div className='sidebarSwitcher'>
                        <IconButton
                            onClick={() => {
                                setUserHidden(true)
                                setHidden(true)
                            }}
                            icon={<HideSidebarIcon/>}
                        />
                    </div>
                </div>}

            {workspace && workspace.id !== '0' &&
                <div className='WorkspaceTitle'>
                    {Utils.isFocalboardPlugin() &&
                    <>
                        <div className='octo-spacer'/>
                        <div className='sidebarSwitcher'>
                            <IconButton
                                onClick={() => {
                                    setUserHidden(true)
                                    setHidden(true)
                                }}
                                icon={<HideSidebarIcon/>}
                            />
                        </div>
                    </>
                    }
                </div>
            }

            <BoardsSwitcher/>

            {

                // !props.isDashboard &&
                <div className='octo-sidebar-list'>
                    {
                        sidebarCategories.map((category) => {
                            return (
                                <SidebarBoardItem
                                    hideSidebar={hideSidebar}
                                    key={category.id}
                                    activeBoardID={props.activeBoardId}
                                    categoryBlocks={category}
                                    boards={boards}
                                    allCategories={sidebarCategories}
                                />
                            )
                        })
                    }
                </div>
            }

            <div className='octo-spacer'/>

            {
                (!props.isDashboard && !Utils.isFocalboardPlugin()) &&
                <SidebarAddBoardMenu
                    activeBoardId={props.activeBoardId}
                />
            }

            {!Utils.isFocalboardPlugin() &&
                <SidebarSettingsMenu activeTheme={getActiveThemeName()}/>}
        </div>
    )
})

export default Sidebar
