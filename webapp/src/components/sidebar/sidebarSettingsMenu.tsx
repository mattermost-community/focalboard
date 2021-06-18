// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useContext, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Archiver} from '../../archiver'
import {
    darkTheme,
    darkThemeName,
    defaultTheme,
    defaultThemeName,
    lightTheme,
    lightThemeName,
    setTheme, systemThemeName,
    Theme,
} from '../../theme'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import {SetLanguageContext} from '../../setLanguageContext'
import {UserSettings} from '../../userSettings'

import './sidebarSettingsMenu.scss'
import CheckIcon from '../../widgets/icons/check'

type Props = {
    setWhiteLogo: (whiteLogo: boolean) => void
    activeTheme: string
}

const SidebarSettingsMenu = React.memo((props: Props) => {
    const intl = useIntl()
    const setLanguage = useContext<(lang: string) => void>(SetLanguageContext)

    // we need this as the sidebar doesn't always need to re-render
    // on theme change. This can cause props and the actual
    // active theme can go out of sync
    const [themeName, setThemeName] = useState(props.activeTheme)

    const updateTheme = (theme: Theme | null, name: string) => {
        const consolidatedTheme = setTheme(theme)
        const whiteLogo = (consolidatedTheme.sidebarWhiteLogo === 'true')
        props.setWhiteLogo(whiteLogo)
        setThemeName(name)
    }

    const [randomIcons, setRandomIcons] = useState(UserSettings.prefillRandomIcons)
    const toggleRandomIcons = () => {
        UserSettings.prefillRandomIcons = !UserSettings.prefillRandomIcons
        setRandomIcons(!randomIcons)
    }

    const languages = [
        {
            code: 'en',
            name: 'english',
            displayName: 'English',
        },
        {
            code: 'es',
            name: 'spanish',
            displayName: 'Español',
        },
        {
            code: 'de',
            name: 'german',
            displayName: 'Deutsch',
        },
        {
            code: 'ja',
            name: 'japanese',
            displayName: '日本語',
        },
        {
            code: 'fr',
            name: 'french',
            displayName: 'Français',
        },
        {
            code: 'nl',
            name: 'dutch',
            displayName: 'Nederlands',
        },
        {
            code: 'ru',
            name: 'russian',
            displayName: 'Pусский',
        },
        {
            code: 'zh-cn',
            name: 'chinese',
            displayName: '中文 (繁體)',
        },
        {
            code: 'zh-tx',
            name: 'simplified-chinese',
            displayName: '中文 (简体)',
        },
        {
            code: 'tr',
            name: 'turkish',
            displayName: 'Türkçe',
        },
        {
            code: 'oc',
            name: 'occitan',
            displayName: 'Occitan',
        },
    ]

    const themes = [
        {
            id: defaultThemeName,
            displayName: 'Default theme',
            theme: defaultTheme,
        },
        {
            id: darkThemeName,
            displayName: 'Dark theme',
            theme: darkTheme,
        },
        {
            id: lightThemeName,
            displayName: 'Light theme',
            theme: lightTheme,
        },
        {
            id: systemThemeName,
            displayName: 'System theme',
            theme: null,
        },
    ]

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
                        {
                            languages.map((language) => (
                                <Menu.Text
                                    key={language.code}
                                    id={`${language.name}-lang`}
                                    name={language.displayName}
                                    onClick={async () => setLanguage(language.code)}
                                    rightIcon={intl.locale.toLowerCase() === language.code ? <CheckIcon/> : null}
                                />
                            ))
                        }
                    </Menu.SubMenu>
                    <Menu.SubMenu
                        id='theme'
                        name={intl.formatMessage({id: 'Sidebar.set-theme', defaultMessage: 'Set theme'})}
                        position='top'
                    >
                        {
                            themes.map((theme) =>
                                (
                                    <Menu.Text
                                        key={theme.id}
                                        id={theme.id}
                                        name={intl.formatMessage({id: `Sidebar.${theme.id}`, defaultMessage: theme.displayName})}
                                        onClick={async () => updateTheme(theme.theme, theme.id)}
                                        rightIcon={themeName === theme.id ? <CheckIcon/> : null}
                                    />
                                ),
                            )
                        }
                    </Menu.SubMenu>
                    <Menu.Switch
                        id='random-icons'
                        name={intl.formatMessage({id: 'Sidebar.random-icons', defaultMessage: 'Random icons'})}
                        isOn={randomIcons}
                        onClick={async () => toggleRandomIcons()}
                    />
                </Menu>
            </MenuWrapper>
        </div>
    )
})

export default SidebarSettingsMenu
