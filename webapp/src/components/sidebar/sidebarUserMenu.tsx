// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {useIntl} from 'react-intl'
import {useHistory} from 'react-router-dom'

import {Constants} from '../../constants'
import octoClient from '../../octoClient'
import {UserContext} from '../../user'
import LogoWithNameIcon from '../../widgets/icons/logoWithName'
import LogoWithNameWhiteIcon from '../../widgets/icons/logoWithNameWhite'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import ModalWrapper from '../modalWrapper'

import RegistrationLink from './registrationLink'

import './sidebarUserMenu.scss'

type Props = {
    whiteLogo: boolean
    showVersionBadge: boolean
}

const SidebarUserMenu = React.memo((props: Props) => {
    const history = useHistory()
    const [showRegistrationLinkDialog, setShowRegistrationLinkDialog] = useState(false)
    const {whiteLogo, showVersionBadge} = props
    const intl = useIntl()
    return (
        <div className='SidebarUserMenu'>
            <ModalWrapper>
                <MenuWrapper>
                    <div className='logo'>
                        {whiteLogo ? <LogoWithNameWhiteIcon/> : <LogoWithNameIcon/>}
                        <div className='octo-spacer'/>
                        <div className='versionFrame'>
                            <div className='version'>
                                {`v${Constants.versionString}`}
                            </div>
                            <div className='versionBadge'>
                            &nbsp;{showVersionBadge ? 'BETA' : ''}&nbsp;
                            </div>
                        </div>
                    </div>
                    <UserContext.Consumer>
                        {(user) => {
                            return (
                                <Menu>
                                    {user && user.username !== 'single-user' && <>
                                        <Menu.Label><b>{user.username}</b></Menu.Label>
                                        <Menu.Text
                                            id='logout'
                                            name={intl.formatMessage({id: 'Sidebar.logout', defaultMessage: 'Log out'})}
                                            onClick={async () => {
                                                octoClient.logout()
                                                history.push('/login')
                                            }}
                                        />
                                        <Menu.Text
                                            id='changePassword'
                                            name={intl.formatMessage({id: 'Sidebar.changePassword', defaultMessage: 'Change password'})}
                                            onClick={async () => {
                                                history.push('/change_password')
                                            }}
                                        />
                                        <Menu.Text
                                            id='invite'
                                            name={intl.formatMessage({id: 'Sidebar.invite-users', defaultMessage: 'Invite Users'})}
                                            onClick={async () => {
                                                setShowRegistrationLinkDialog(true)
                                            }}
                                        />

                                        <Menu.Separator/>
                                    </>}

                                    <Menu.Text
                                        id='about'
                                        name={intl.formatMessage({id: 'Sidebar.about', defaultMessage: 'About Focalboard'})}
                                        onClick={async () => {
                                            window.open('https://www.focalboard.com?utm_source=webapp', '_blank')

                                            // TODO: Review if this is needed in the future, this is to fix the problem with linux webview links
                                            if ((window as any).openInNewBrowser) {
                                                (window as any).openInNewBrowser('https://www.focalboard.com?utm_source=webapp')
                                            }
                                        }}
                                    />
                                </Menu>
                            )
                        }}
                    </UserContext.Consumer>
                </MenuWrapper>

                {showRegistrationLinkDialog &&
                    <RegistrationLink
                        onClose={() => {
                            setShowRegistrationLinkDialog(false)
                        }}
                    />
                }
            </ModalWrapper>
        </div>
    )
})

export default SidebarUserMenu
