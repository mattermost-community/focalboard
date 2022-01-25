// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react'

import {useDispatch} from 'react-redux'

// import {getInt} from 'mattermost-redux/selectors/entities/preferences'
// import {GlobalState} from 'mattermost-redux/types/store'
//
// import {savePreferences} from 'mattermost-redux/actions/preferences'
// import {getCurrentUserId} from 'mattermost-redux/selectors/entities/common'

// import Constants, {Preferences} from 'utils/constants'
// import * as Utils from 'utils/utils'

// import {trackEvent} from '../../actions/telemetry_actions'

import {useAppSelector} from '../../store/hooks'
import {getMe, getOnboardingTourStep, patchProps} from '../../store/users'
import {UserConfigPatch} from '../../user'
import mutator from '../../mutator'
import {TOUR_ONBOARDING, TutorialSteps} from '../onboardingTour'

type Props = {
    autoTour?: boolean;
    telemetryTag?: string;
    tutorialCategory: string;
    step: number;
    onNextNavigateTo?: () => void;
    onPrevNavigateTo?: () => void;
}
const useTutorialTourTipManager = ({step, autoTour, telemetryTag, tutorialCategory, onNextNavigateTo, onPrevNavigateTo}: Props) => {
    const [show, setShow] = useState(false)
    const me = useAppSelector(getMe)

    // const currentUserId = me?.id
    const currentStep = parseInt(useAppSelector(getOnboardingTourStep), 10)
    const dispatch = useDispatch()

    useEffect(() => {
        if (autoTour) {
            setShow(true)
        }
    }, [autoTour])

    const hide = (): void => {
        setShow(false)
    }

    const dismiss = (): void => {
        hide()
        handleNext(false)

        // const tag = telemetryTag + '_dismiss'

        // TODO add this telemetry
        // trackEvent('tutorial', tag)
    }

    const handleSavePreferences = async (isAutoTour: boolean, nextStep: boolean | number): Promise<void> => {
        // change this
        let stepValue = currentStep || step
        if (nextStep === true) {
            stepValue += 1
        } else if (nextStep === false) {
            stepValue -= 1
        } else {
            stepValue = nextStep
        }

        // const preferences = [
        //     {
        //         user_id: currentUserId,
        //         category: tutorialCategory || Preferences.TUTORIAL_STEP,
        //         name: currentUserId,
        //         value: stepValue.toString(),
        //     },
        // ]

        const patch: UserConfigPatch = {
            updatedFields: {
                focalboard_onboardingTourStep: stepValue.toString(),
            },
        }

        hide()

        // dispatch(savePreferences(currentUserId, preferences))
        const updatedProps = await mutator.patchUserConfig(me!.id, patch)
        if (updatedProps) {
            await dispatch(patchProps(updatedProps))
        }

        if (onNextNavigateTo && nextStep === true && isAutoTour) {
            onNextNavigateTo()
        } else if (onPrevNavigateTo && nextStep === false && isAutoTour) {
            onPrevNavigateTo()
        }
    }

    const handlePrevious = (e: React.MouseEvent): void => {
        e.preventDefault()
        handleSavePreferences(true, false)
    }

    const handleNext = (auto = true, e?: React.MouseEvent): void => {
        e?.preventDefault()
        if (telemetryTag) {
            // const tag = telemetryTag + '_next'

            // TODO add telemetry here
            // trackEvent('tutorial', tag)
        }
        if (getLastStep() === currentStep) {
            handleSavePreferences(auto, TutorialSteps[tutorialCategory].FINISHED)
        } else {
            handleSavePreferences(auto, true)
        }
    }

    const skipTutorial = async (e: React.MouseEvent): Promise<void> => {
        e.preventDefault()

        if (telemetryTag) {
            // const tag = telemetryTag + '_skip'

            // TODO add this telemetry
            // trackEvent('tutorial', tag)
        }

        // const preferences = [{
        //     user_id: currentUserId,
        //     category: tutorialCategory || Preferences.TUTORIAL_STEP,
        //     name: currentUserId,
        //     value: FINISHED.toString(),
        // }]
        // dispatch(savePreferences(currentUserId, preferences))

        const patch: UserConfigPatch = {
            updatedFields: {
                focalboard_onboardingTourSkipped: true,
            },
        }
        const updatedProps = await mutator.patchUserConfig(me!.id, patch)
        if (updatedProps) {
            await dispatch(patchProps(updatedProps))
        }
    }

    const tourSteps = TutorialSteps[TOUR_ONBOARDING]
    const getLastStep = () => {
        return Object.values(tourSteps).reduce((maxStep, candidateMaxStep) => {
            // ignore the "opt out" FINISHED step as the max step.
            if (candidateMaxStep > maxStep && candidateMaxStep !== tourSteps.FINISHED) {
                return candidateMaxStep
            }
            return maxStep
        }, Number.MIN_SAFE_INTEGER)
    }
    return {

        show,
        hide,
        dismiss,
        handleNext,
        handlePrevious,
        skipTutorial,
        getLastStep,
        tourSteps,
        setShow,
    }
}

export default useTutorialTourTipManager
