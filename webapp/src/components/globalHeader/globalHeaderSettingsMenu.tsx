// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {useIntl} from 'react-intl'
import {History} from 'history'

import {Archiver} from '../../archiver'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {storeLanguage} from '../../store/language'
import {patchProps, getMe} from '../../store/users'
import {getCurrentTeam, Team} from '../../store/teams'
import {IUser, UserConfigPatch} from '../../user'
import octoClient from '../../octoClient'
import {UserSettings} from '../../userSettings'
import CheckIcon from '../../widgets/icons/check'
import SettingsIcon from '../../widgets/icons/settings'

import {Constants} from '../../constants'
import TelemetryClient, {TelemetryCategory, TelemetryActions} from '../../telemetry/telemetryClient'

import './globalHeaderSettingsMenu.scss'

type Props = {
    history: History<unknown>
}

const GlobalHeaderSettingsMenu = (props: Props) => {
    const intl = useIntl()
    const me = useAppSelector<IUser|null>(getMe)
    const currentTeam = useAppSelector<Team|null>(getCurrentTeam)
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
                    <Menu.SubMenu
                        id='import'
                        name={intl.formatMessage({id: 'Sidebar.import', defaultMessage: 'Import'})}
                        position='left-bottom'
                    >
                        <Menu.Text
                            id='import_archive'
                            name={intl.formatMessage({id: 'Sidebar.import-archive', defaultMessage: 'Import archive'})}
                            onClick={async () => {
                                TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ImportArchive)
                                Archiver.importFullArchive()
                            }}
                        />
                        {
                            Constants.imports.map((i) => (
                                <Menu.Text
                                    key={`${i.id}-import`}
                                    id={`${i.id}-import`}
                                    name={i.displayName}
                                    onClick={() => {
                                        TelemetryClient.trackEvent(TelemetryCategory, i.telemetryName)
                                        window.open(i.href)
                                    }}
                                />
                            ))
                        }
                    </Menu.SubMenu>
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
                        suppressItemClicked={true}
                    />
                    {me?.is_guest !== true &&
                        <Menu.Text
                            id='product-tour'
                            className='product-tour'
                            name={intl.formatMessage({id: 'Sidebar.product-tour', defaultMessage: 'Product tour'})}
                            onClick={async () => {
                                TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.StartTour)

                                if (!me) {
                                    return
                                }
                                if (!currentTeam) {
                                    return
                                }

                                const patch: UserConfigPatch = {
                                    updatedFields: {
                                        onboardingTourStarted: '1',
                                        onboardingTourStep: '0',
                                        tourCategory: 'onboarding',
                                    },
                                }

                                const patchedProps = await octoClient.patchUserConfig(me.id, patch)
                                if (patchedProps) {
                                    await dispatch(patchProps(patchedProps))
                                }

                                const onboardingData = await octoClient.prepareOnboarding(currentTeam.id)

                                const newPath = `/team/${onboardingData?.teamID}/${onboardingData?.boardID}`

                                props.history.push(newPath)
                            }}
                        />}
                </Menu>
            </MenuWrapper>
        </div>
    )
}

export default React.memo(GlobalHeaderSettingsMenu)
