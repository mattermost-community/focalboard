// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {useIntl} from 'react-intl'

import {Archiver} from '../../archiver'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import {useAppDispatch} from '../../store/hooks'
import {storeLanguage} from '../../store/language'
import {UserSettings} from '../../userSettings'
import CheckIcon from '../../widgets/icons/check'
import SettingsIcon from '../../widgets/icons/settings'

import {Constants} from '../../constants'

import './globalHeaderSettingsMenu.scss'

const GlobalHeaderSettingsMenu = React.memo(() => {
    const intl = useIntl()
    const dispatch = useAppDispatch()

    const [randomIcons, setRandomIcons] = useState(UserSettings.prefillRandomIcons)
    const toggleRandomIcons = () => {
        UserSettings.prefillRandomIcons = !UserSettings.prefillRandomIcons
        setRandomIcons(!randomIcons)
    }

    return (
        <div className='GlobalHeaderSettingsMenu'>
            <MenuWrapper>
                <div className='GlobalHeaderComponent__button menu-entry'>
                    <SettingsIcon/>
                </div>
                <Menu position='left'>
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
                        position='left-bottom'
                    >
                        {
                            Constants.languages.map((language) => (
                                <Menu.Text
                                    key={language.code}
                                    id={`${language.name}-lang`}
                                    name={language.displayName}
                                    onClick={async () => dispatch(storeLanguage(language.code))}
                                    rightIcon={intl.locale.toLowerCase() === language.code ? <CheckIcon/> : null}
                                />
                            ))
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

export default GlobalHeaderSettingsMenu
