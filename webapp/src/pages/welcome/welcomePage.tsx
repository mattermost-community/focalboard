// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {useLocation, useHistory} from 'react-router-dom'

import BoardWelcomePNG from '../../../static/boards-welcome.png'
import BoardWelcomeSmallPNG from '../../../static/boards-welcome-small.png'

import Button from '../../widgets/buttons/button'
import CompassIcon from '../../widgets/icons/compassIcon'
import {Utils} from '../../utils'

import './welcomePage.scss'
import mutator from '../../mutator'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {IUser, UserConfigPatch, UserPropPrefix} from '../../user'
import {fetchMe, getMe, patchProps} from '../../store/users'
import {getCurrentTeam, Team} from '../../store/teams'
import octoClient from '../../octoClient'
import {FINISHED, TOUR_ORDER} from '../../components/onboardingTour'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import {UserSettingKey} from '../../userSettings'

const WelcomePage = () => {
    const history = useHistory()
    const queryString = new URLSearchParams(useLocation().search)
    const me = useAppSelector<IUser|null>(getMe)
    const currentTeam = useAppSelector<Team|null>(getCurrentTeam)
    const dispatch = useAppDispatch()

    const setWelcomePageViewed = async (userID: string):Promise<any> => {
        const patch: UserConfigPatch = {}
        patch.updatedFields = {}
        patch.updatedFields[UserPropPrefix + UserSettingKey.WelcomePageViewed] = '1'

        const updatedProps = await mutator.patchUserConfig(userID, patch)
        if (updatedProps) {
            return dispatch(patchProps(updatedProps))
        }

        return Promise.resolve()
    }

    const goForward = () => {
        if (queryString.get('r')) {
            history.replace(queryString.get('r')!)
            return
        }
        if (currentTeam) {
            history.replace(`/team/${currentTeam?.id}`)
        } else {
            history.replace('/')
        }
    }

    const skipTour = async () => {
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.SkipTour)

        if (me) {
            await setWelcomePageViewed(me.id)
            const patch: UserConfigPatch = {
                updatedFields: {
                    focalboard_tourCategory: TOUR_ORDER[TOUR_ORDER.length - 1],
                    focalboard_onboardingTourStep: FINISHED.toString(),
                },
            }

            const patchedProps = await octoClient.patchUserConfig(me.id, patch)
            if (patchedProps) {
                await dispatch(patchProps(patchedProps))
            }
        }

        goForward()
    }

    const startTour = async () => {
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.StartTour)

        if (!me) {
            return
        }
        if (!currentTeam) {
            return
        }

        await setWelcomePageViewed(me.id)
        const onboardingData = await octoClient.prepareOnboarding(currentTeam.id)
        await dispatch(fetchMe())
        const newPath = `/team/${onboardingData?.teamID}/${onboardingData?.boardID}`
        history.replace(newPath)
    }

    if (me?.props && me?.props[UserPropPrefix + UserSettingKey.WelcomePageViewed]) {
        goForward()
        return null
    }

    return (
        <div className='WelcomePage'>
            <div className='wrapper'>
                <h1 className='text-heading9'>
                    <FormattedMessage
                        id='WelcomePage.Heading'
                        defaultMessage='Welcome To Boards'
                    />
                </h1>
                <div className='WelcomePage__subtitle'>
                    <FormattedMessage
                        id='WelcomePage.Description'
                        defaultMessage='Boards is a project management tool that helps define, organize, track and manage work across teams, using a familiar kanban board view'
                    />
                </div>

                {/* This image will be rendered on large screens over 2000px */}
                <img
                    src={Utils.buildURL(BoardWelcomePNG, true)}
                    className='WelcomePage__image WelcomePage__image--large'
                    alt='Boards Welcome Image'
                />

                {/* This image will be rendered on small screens below 2000px */}
                <img
                    src={Utils.buildURL(BoardWelcomeSmallPNG, true)}
                    className='WelcomePage__image WelcomePage__image--small'
                    alt='Boards Welcome Image'
                />

                <Button
                    onClick={startTour}
                    filled={true}
                    size='large'
                    icon={
                        <CompassIcon
                            icon='chevron-right'
                            className='Icon Icon--right'
                        />}
                    rightIcon={true}
                >
                    <FormattedMessage
                        id='WelcomePage.Explore.Button'
                        defaultMessage='Take a tour'
                    />
                </Button>

                <a
                    className='skip'
                    onClick={skipTour}
                >
                    <FormattedMessage
                        id='WelcomePage.NoThanks.Text'
                        defaultMessage="No thanks, I'll figure it out myself"
                    />
                </a>
            </div>
        </div>
    )
}

export default React.memo(WelcomePage)
