// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

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
    intl: IntlShape
}

type State = {
    isHidden: boolean
    whiteLogo: boolean
}

class Sidebar extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {isHidden: false, whiteLogo: false}
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidMount(): void {
        this.updateLogo()
    }

    private updateLogo() {
        const theme = loadTheme()
        const whiteLogo = theme.sidebarWhiteLogo === 'true'
        if (this.state.whiteLogo !== whiteLogo) {
            this.setState({whiteLogo})
        }
    }

    render(): JSX.Element {
        const {workspaceTree, intl} = this.props
        if (!workspaceTree) {
            return <div/>
        }

        const {boards, views} = workspaceTree

        if (this.state.isHidden) {
            return (
                <div className='Sidebar octo-sidebar hidden'>
                    <div className='octo-sidebar-header show-button'>
                        <div className='hamburger-icon'>
                            <IconButton
                                icon={<HamburgerIcon/>}
                                onClick={this.showClicked}
                            />
                        </div>
                        <div className='show-icon'>
                            <IconButton
                                icon={<ShowSidebarIcon/>}
                                onClick={this.showClicked}
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
                            whiteLogo={this.state.whiteLogo}
                        />
                    </div>

                    <div className='octo-spacer'/>
                    <IconButton
                        onClick={this.hideClicked}
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
                                    showBoard={this.props.showBoard}
                                    showView={this.props.showView}
                                    activeBoardId={this.props.activeBoardId}
                                    nextBoardId={nextBoardId}
                                />
                            )
                        })
                    }
                </div>

                <div className='octo-spacer'/>


                <SidebarAddBoardMenu
                    showBoard={this.props.showBoard}
                    workspaceTree={this.props.workspaceTree}
                    activeBoardId={this.props.activeBoardId}
                />

                <SidebarSettingsMenu
                    setLanguage={this.props.setLanguage}
                    setWhiteLogo={(whiteLogo: boolean) => this.setState({whiteLogo})}
                /> 
            </div>
        )
    }

    private hideClicked = () => {
        this.setState({isHidden: true})
    }

    private showClicked = () => {
        this.setState({isHidden: false})
    }
}

export default injectIntl(Sidebar)
