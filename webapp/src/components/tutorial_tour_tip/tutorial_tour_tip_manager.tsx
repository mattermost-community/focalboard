// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react'

import {useDispatch} from 'react-redux'

import {FINISHED, BaseTourSteps, TourCategoriesMapToSteps} from '../onboardingTour'
import {useAppSelector} from '../../store/hooks'
import {getMe, getOnboardingTourStep, patchProps} from '../../store/users'
import {UserConfigPatch} from '../../user'
import octoClient from '../../octoClient'
import {Utils, KeyCodes} from '../../utils'

export interface TutorialTourTipManager {
    show: boolean;
    tourSteps: Record<string, number>;
    getLastStep: () => number;
    handleOpen: (e: React.MouseEvent) => void;
    handleHide: (e: React.MouseEvent) => void;
    handleSkipTutorial: (e: React.MouseEvent) => void;
    handleDismiss: (e: React.MouseEvent) => void;
    handleSavePreferences: (step: number) => void;
    handlePrevious: (e: React.MouseEvent) => void;
    handleNext: (e?: React.MouseEvent) => void;
    handleEventPropagationAndDefault: (e: React.MouseEvent | KeyboardEvent) => void
}

type Props = {
    autoTour?: boolean;
    telemetryTag?: string;
    tutorialCategory: string;
    step: number;
    onNextNavigateTo?: () => void;
    onPrevNavigateTo?: () => void;
    stopPropagation?: boolean;
    preventDefault?: boolean;
}

const useTutorialTourTipManager = ({
    autoTour,
    telemetryTag,
    tutorialCategory,
    onNextNavigateTo,
    onPrevNavigateTo,
    stopPropagation,
    preventDefault,
}: Props): TutorialTourTipManager => {
    const [show, setShow] = useState(false)
    const tourSteps = TourCategoriesMapToSteps[tutorialCategory]

    // Function to save the tutorial step in redux store start here which needs to be modified
    const dispatch = useDispatch()
    const me = useAppSelector(getMe)
    const currentUserId = me?.id
    const currentStep = parseInt(useAppSelector(getOnboardingTourStep), 10)
    const savePreferences = useCallback(
        async (useID: string, stepValue: string) => {
            // const preferences = [
            //     {
            //         user_id: useID,
            //         category: tutorialCategory,
            //         name: useID,
            //         value: stepValue,
            //     },
            // ]
            // dispatch(storeSavePreferences(useID, preferences))

            if (!currentUserId) {
                return
            }

            const patch: UserConfigPatch = {
                updatedFields: {
                    focalboard_onboardingTourStep: stepValue,
                },
            }
            const patchedProps = await octoClient.patchUserConfig(currentUserId, patch)
            if (patchedProps) {
                await dispatch(patchProps(patchedProps))
            }
        },
        [dispatch],
    )

    const trackEvent = useCallback((category, event, props?) => {
        // TODO implement and this
        console.log(`Track: ${category}, ${event}, ${props}`)

        // trackEventAction(category, event, props)
    }, [])

    // Function to save the tutorial step in redux store end here

    const handleEventPropagationAndDefault = (e: React.MouseEvent | KeyboardEvent) => {
        if (stopPropagation) {
            e.stopPropagation()
        }
        if (preventDefault) {
            e.preventDefault()
        }
    }

    const handleKeyDown = useCallback((e: KeyboardEvent): void => {
        if (Utils.isKeyPressed(e, KeyCodes.ENTER) && show) {
            handleNext()
        }
    }, [show])

    useEffect(() => {
        if (autoTour) {
            setShow(true)
        }
    }, [autoTour])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () =>
            window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleHide = (e?: React.MouseEvent): void => {
        // if (e) {
        //     handleEventPropagationAndDefault(e)
        // }
        setShow(false)
    }

    const handleOpen = (e: React.MouseEvent): void => {
        handleEventPropagationAndDefault(e)
        setShow(true)
    }

    const handleDismiss = (e: React.MouseEvent): void => {
        handleEventPropagationAndDefault(e)
        handleHide()

        // open for discussion should we move forward if user dismiss like next time show them next tip instead of the same one.
        handleNext(e)
        const tag = telemetryTag + '_dismiss'
        trackEvent('tutorial', tag)
    }

    const handleSavePreferences = async (nextStep: boolean | number): Promise<void> => {
        if (!currentUserId) {
            return
        }

        let stepValue = currentStep
        if (nextStep === true) {
            stepValue += 1
        } else if (nextStep === false) {
            stepValue -= 1
        } else {
            stepValue = nextStep
        }
        handleHide()
        await savePreferences(currentUserId, stepValue.toString())
        if (onNextNavigateTo && nextStep === true && autoTour) {
            onNextNavigateTo()
        } else if (onPrevNavigateTo && nextStep === false && autoTour) {
            onPrevNavigateTo()
        }
    }

    const handlePrevious = (e: React.MouseEvent): void => {
        handleEventPropagationAndDefault(e)
        handleSavePreferences(false)
    }

    const handleNext = (e?: React.MouseEvent): void => {
        console.log('handling next')
        if (e) {
            handleEventPropagationAndDefault(e)
        }
        if (telemetryTag) {
            const tag = telemetryTag + '_next'
            trackEvent('tutorial', tag)
        }
        if (getLastStep() === currentStep) {
            handleSavePreferences(FINISHED)
        } else {
            handleSavePreferences(true)
        }
    }

    const handleSkipTutorial = (e: React.MouseEvent): void => {
        handleEventPropagationAndDefault(e)

        if (telemetryTag) {
            const tag = telemetryTag + '_skip'
            trackEvent('tutorial', tag)
        }

        if (currentUserId) {
            savePreferences(currentUserId, FINISHED.toString())
        }
    }

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
        tourSteps,
        handleOpen,
        handleHide,
        handleDismiss,
        handleNext,
        handlePrevious,
        handleSkipTutorial,
        handleSavePreferences,
        getLastStep,
        handleEventPropagationAndDefault,
    }
}

export default useTutorialTourTipManager
