// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {injectIntl, IntlShape} from 'react-intl'

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
    intl: IntlShape
}

const SidebarUserMenu = React.memo((props: Props) => {
    const [showRegistrationLinkDialog, setShowRegistrationLinkDialog] = useState(false)
    const {intl, whiteLogo} = props
    return (
        <div className='SidebarUserMenu'>
            <ModalWrapper>
                <MenuWrapper>
                    <div className='logo'>
                        {whiteLogo ? <LogoWithNameWhiteIcon/> : <LogoWithNameIcon/>}
                        <div className='octo-spacer'/>
                        <div className='version'>
                            {`v${Constants.versionString}`}
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

export default injectIntl(SidebarUserMenu)
