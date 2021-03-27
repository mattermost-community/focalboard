// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {Constants} from '../../constants'
import octoClient from '../../octoClient'
import {loadTheme} from '../../theme'
import {IUser, UserContext} from '../../user'
import {WorkspaceTree} from '../../viewModel/workspaceTree'
import IconButton from '../../widgets/buttons/iconButton'
import HamburgerIcon from '../../widgets/icons/hamburger'
import HideSidebarIcon from '../../widgets/icons/hideSidebar'
import LogoWithNameIcon from '../../widgets/icons/logoWithName'
import LogoWithNameWhiteIcon from '../../widgets/icons/logoWithNameWhite'
import ShowSidebarIcon from '../../widgets/icons/showSidebar'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import ModalWrapper from '../modalWrapper'
import RegistrationLink from '../registrationLink'

import SidebarSettingsMenu from './sidebarSettingsMenu'
import SidebarAddBoardMenu from './sidebarAddBoardMenu'
import SidebarBoardItem from './sidebarBoardItem'
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
    showRegistrationLinkDialog?: boolean
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
                        <UserContext.Consumer>
                            {(user) => {
                                return this.renderUserMenu(user)
                            }}
                        </UserContext.Consumer>
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

    private renderUserMenu(user?: IUser): JSX.Element {
        const {intl} = this.props

        return (
            <ModalWrapper>
                <MenuWrapper>
                    <div className='logo'>
                        {this.state.whiteLogo ? <LogoWithNameWhiteIcon/> : <LogoWithNameIcon/>}
                        <div className='octo-spacer'/>
                        <div className='version'>
                            {`v${Constants.versionString}`}
                        </div>
                    </div>
                    <Menu>
                        {user && user.username !== 'single-user' && <>
                            <Menu.Label><b>{user.username}</b></Menu.Label>
                            <Menu.Text
                                id='logout'
                                name={intl.formatMessage({id: 'Sidebar.logout', defaultMessage: 'Log out'})}
                                onClick={async () => {
                                    octoClient.logout()
                                    window.location.href = '/login'
                                }}
                            />
                            <Menu.Text
                                id='changePassword'
                                name={intl.formatMessage({id: 'Sidebar.changePassword', defaultMessage: 'Change password'})}
                                onClick={async () => {
                                    window.location.href = '/change_password'
                                }}
                            />
                            <Menu.Text
                                id='invite'
                                name={intl.formatMessage({id: 'Sidebar.invite-users', defaultMessage: 'Invite Users'})}
                                onClick={async () => {
                                    this.setState({showRegistrationLinkDialog: true})
                                }}
                            />

                            <Menu.Separator/>
                        </>}

                        <Menu.Text
                            id='about'
                            name={intl.formatMessage({id: 'Sidebar.about', defaultMessage: 'About Focalboard'})}
                            onClick={async () => {
                                this.showAbout()
                            }}
                        />
                    </Menu>
                </MenuWrapper>

                {this.state.showRegistrationLinkDialog &&
                    <RegistrationLink
                        onClose={() => {
                            this.setState({showRegistrationLinkDialog: false})
                        }}
                    />
                }
            </ModalWrapper>
        )
    }

    private hideClicked = () => {
        this.setState({isHidden: true})
    }

    private showClicked = () => {
        this.setState({isHidden: false})
    }

    private showAbout = () => {
        const url = 'https://www.focalboard.com?utm_source=webapp'
        window.open(url, '_blank')
    }
}

export default injectIntl(Sidebar)
