// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useContext} from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {Archiver} from '../../archiver'
import {darkTheme, defaultTheme, lightTheme, setTheme, Theme} from '../../theme'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import {SetLanguageContext} from '../../setLanguageContext'

import './sidebarSettingsMenu.scss'

type Props = {
    intl: IntlShape
    setWhiteLogo: (whiteLogo: boolean) => void
}

const SidebarSettingsMenu = React.memo((props: Props) => {
    const {intl} = props
    const setLanguage = useContext(SetLanguageContext)

    const updateTheme = (theme: Theme | null) => {
        const consolidatedTheme = setTheme(theme)
        const whiteLogo = (consolidatedTheme.sidebarWhiteLogo === 'true')
        props.setWhiteLogo(whiteLogo)
    }

    return (
        <div className='SidebarSettingsMenu'>
            <MenuWrapper>
                <div className='menu-entry'>
                    <FormattedMessage
                        id='Sidebar.settings'
                        defaultMessage='Settings'
                    />
                </div>
                <Menu position='top'>
                    <Menu.Text
                        id='import'
                        name={intl.formatMessage({id: 'Sidebar.import-archive', defaultMessage: 'Import archive'})}
                        onClick={async () => Archiver.importFullArchive()}
                    />
                    <Menu.Text
                        id='export'
                        name={intl.formatMessage({id: 'Sidebar.export-archive', defaultMessage: 'Export archive'})}
                        onClick={async () => Archiver.exportFullArchive()}
                    />
                    <Menu.SubMenu
                        id='lang'
                        name={intl.formatMessage({id: 'Sidebar.set-language', defaultMessage: 'Set language'})}
                        position='top'
                    >
                        <Menu.Text
                            id='english-lang'
                            name={intl.formatMessage({id: 'Sidebar.english', defaultMessage: 'English'})}
                            onClick={async () => setLanguage('en')}
                        />
                        <Menu.Text
                            id='spanish-lang'
                            name={intl.formatMessage({id: 'Sidebar.spanish', defaultMessage: 'Spanish'})}
                            onClick={async () => setLanguage('es')}
                        />
                        <Menu.Text
                            id='german-lang'
                            name={intl.formatMessage({id: 'Sidebar.german', defaultMessage: 'German'})}
                            onClick={async () => setLanguage('de')}
                        />
                        <Menu.Text
                            id='japanese-lang'
                            name={intl.formatMessage({id: 'Sidebar.japanese', defaultMessage: 'Japanese'})}
                            onClick={async () => setLanguage('ja')}
                        />
                        <Menu.Text
                            id='french-lang'
                            name={intl.formatMessage({id: 'Sidebar.french', defaultMessage: 'French'})}
                            onClick={async () => setLanguage('fr')}
                        />
                        <Menu.Text
                            id='dutch-lang'
                            name={intl.formatMessage({id: 'Sidebar.dutch', defaultMessage: 'Dutch'})}
                            onClick={async () => setLanguage('nl')}
                        />
                        <Menu.Text
                            id='russian-lang'
                            name={intl.formatMessage({id: 'Sidebar.russian', defaultMessage: 'Russian'})}
                            onClick={async () => setLanguage('ru')}
                        />
                        <Menu.Text
                            id='chinese-lang'
                            name={intl.formatMessage({id: 'Sidebar.chinese', defaultMessage: 'Chinese'})}
                            onClick={async () => setLanguage('zh')}
                        />
                        <Menu.Text
                            id='turkish-lang'
                            name={intl.formatMessage({id: 'Sidebar.turkish', defaultMessage: 'Turkish'})}
                            onClick={async () => setLanguage('tr')}
                        />
                        <Menu.Text
                            id='occitan-lang'
                            name={intl.formatMessage({id: 'Sidebar.occitan', defaultMessage: 'Occitan'})}
                            onClick={async () => setLanguage('oc')}
                        />
                    </Menu.SubMenu>
                    <Menu.SubMenu
                        id='theme'
                        name={intl.formatMessage({id: 'Sidebar.set-theme', defaultMessage: 'Set theme'})}
                        position='top'
                    >
                        <Menu.Text
                            id='default-theme'
                            name={intl.formatMessage({id: 'Sidebar.default-theme', defaultMessage: 'Default theme'})}
                            onClick={async () => updateTheme(defaultTheme)}
                        />
                        <Menu.Text
                            id='dark-theme'
                            name={intl.formatMessage({id: 'Sidebar.dark-theme', defaultMessage: 'Dark theme'})}
                            onClick={async () => updateTheme(darkTheme)}
                        />
                        <Menu.Text
                            id='light-theme'
                            name={intl.formatMessage({id: 'Sidebar.light-theme', defaultMessage: 'Light theme'})}
                            onClick={async () => updateTheme(lightTheme)}
                        />
                        <Menu.Text
                            id='system-theme'
                            name={intl.formatMessage({id: 'Sidebar.system-theme', defaultMessage: 'System theme'})}
                            onClick={async () => updateTheme(null)}
                        />
                    </Menu.SubMenu>
                </Menu>
            </MenuWrapper>
        </div>
    )
})

export default injectIntl(SidebarSettingsMenu)
