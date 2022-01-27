// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useRef} from 'react'
import Tippy from '@tippyjs/react'
import ReactDOM from 'react-dom'
import {FormattedMessage} from 'react-intl'

import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light-border.css'
import 'tippy.js/animations/scale-subtle.css'
import 'tippy.js/animations/perspective-subtle.css'

import {Placement} from 'tippy.js'

import PulsatingDot from '../pulsating_dot'

import TutorialTourTipBackdrop, {Coords, TutorialTourTipPunchout} from './tutorial_tour_tip_backdrop'

import './tutorial_tour_tip.scss'
import useTutorialTourTipManager from './tutorial_tour_tip_manager'

const TourTipOverlay = ({children, show, onClick}: {children: React.ReactNode ; show: boolean; onClick: (e: React.MouseEvent) => void}) =>
    (show ? ReactDOM.createPortal(
        <div
            className='tutorial-tour-tip__overlay'
            onClick={onClick}
        >
            {children}
        </div>,
        document.body,
    ) : null)

type Props = {
    screen: JSX.Element;
    title: JSX.Element;
    imageURL?: string;
    punchOut?: TutorialTourTipPunchout | null;
    step: number;
    singleTip?: boolean;
    showOptOut?: boolean;
    placement?: Placement;
    telemetryTag?: string;
    stopPropagation?: boolean;
    preventDefault?: boolean;
    tutorialCategory: string;
    onNextNavigateTo?: () => void;
    onPrevNavigateTo?: () => void;
    autoTour?: boolean;
    pulsatingDotPosition?: Coords | undefined;
    width?: string | number;
}

const TutorialTourTip: React.FC<Props> = ({
    title,
    screen,
    imageURL,
    punchOut,
    autoTour,
    tutorialCategory,
    singleTip,
    step,
    onNextNavigateTo,
    onPrevNavigateTo,
    telemetryTag,
    placement,
    showOptOut,
    pulsatingDotPosition,
    stopPropagation = true,
    preventDefault = true,
    width = 320,
}: Props) => {
    const triggerRef = useRef(null)
    const {
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
    } = useTutorialTourTipManager({
        step,
        autoTour,
        telemetryTag,
        tutorialCategory,
        onNextNavigateTo,
        onPrevNavigateTo,
        stopPropagation,
        preventDefault,
    })

    const getButtonText = (): JSX.Element => {
        let buttonText = (
            <>
                <FormattedMessage
                    id={'tutorial_tip.ok'}
                    defaultMessage={'Next'}
                />
                <i className='icon icon-chevron-right'/>
            </>
        )
        if (singleTip) {
            buttonText = (
                <FormattedMessage
                    id={'tutorial_tip.got_it'}
                    defaultMessage={'Got it'}
                />
            )
            return buttonText
        }

        const lastStep = getLastStep()
        if (step === lastStep) {
            buttonText = (
                <FormattedMessage
                    id={'tutorial_tip.finish_tour'}
                    defaultMessage={'Finish tour'}
                />
            )
        }

        return buttonText
    }

    const dots = []

    if (!singleTip && tourSteps) {
        for (let i = 0; i < (Object.values(tourSteps).length - 1); i++) {
            let className = 'tutorial-tour-tip__circle'
            let circularRing = 'tutorial-tour-tip__circular-ring'

            if (i === step) {
                className += ' active'
                circularRing += ' tutorial-tour-tip__circular-ring-active'
            }

            dots.push(
                <div className={circularRing}>
                    <a
                        href='#'
                        key={'dotactive' + i}
                        className={className}
                        data-screen={i}
                        onClick={() => handleSavePreferences(i)}
                    />
                </div>,
            )
        }
    }

    const content = (
        <>
            <div className='tutorial-tour-tip__header'>
                <h4 className='tutorial-tour-tip__header__title'>
                    {title}
                </h4>
                <button
                    className='tutorial-tour-tip__header__close'
                    onClick={handleDismiss}
                >
                    <i className='icon icon-close'/>
                </button>
            </div>
            <div className='tutorial-tour-tip__body'>
                {screen}
            </div>
            {imageURL && (
                <div className='tutorial-tour-tip__image'>
                    <img
                        src={imageURL}
                        alt={'tutorial tour tip product image'}
                    />
                </div>
            )}
            <div className='tutorial-tour-tip__footer'>
                <div className='tutorial-tour-tip__footer-buttons'>
                    <div className='tutorial-tour-tip__circles-ctr'>{dots}</div>
                    <div className={'tutorial-tour-tip__btn-ctr'}>
                        {step !== 0 && (
                            <button
                                id='tipPreviousButton'
                                className='tutorial-tour-tip__btn tutorial-tour-tip__cancel-btn'
                                onClick={handlePrevious}
                            >
                                <i className='icon icon-chevron-left'/>
                                <FormattedMessage
                                    id='generic.previous'
                                    defaultMessage='Previous'
                                />
                            </button>
                        )}
                        <button
                            id='tipNextButton'
                            className='tutorial-tour-tip__btn tutorial-tour-tip__confirm-btn'
                            onClick={handleNext}
                        >
                            {getButtonText()}
                        </button>
                    </div>
                </div>
                {showOptOut && <div className='tutorial-tour-tip__opt'>
                    <FormattedMessage
                        id='tutorial_tip.seen'
                        defaultMessage='Seen this before? '
                    />
                    <a
                        href='#'
                        onClick={handleSkipTutorial}
                    >
                        <FormattedMessage
                            id='tutorial_tip.out'
                            defaultMessage='Opt out of these tips.'
                        />
                    </a>
                </div>}
            </div>
        </>
    )

    return (
        <>
            <div
                ref={triggerRef}
                onClick={handleOpen}
                className='tutorial-tour-tip__pulsating-dot-ctr'
            >
                <PulsatingDot coords={pulsatingDotPosition}/>
            </div>
            <TourTipOverlay
                show={show}
                onClick={handleHide}
            >
                <TutorialTourTipBackdrop
                    x={punchOut?.x}
                    y={punchOut?.y}
                    width={punchOut?.width}
                    height={punchOut?.height}
                />
            </TourTipOverlay>
            {show && (
                <Tippy
                    showOnCreate={show}
                    content={content}
                    animation='scale-subtle'
                    trigger='click'
                    duration={[250, 150]}
                    maxWidth={width}
                    aria={{content: 'labelledby'}}
                    allowHTML={true}
                    zIndex={9999}
                    reference={triggerRef}
                    interactive={true}
                    appendTo={document.body}
                    className={'tutorial-tour-tip__box'}
                    placement={placement}
                />
            )}
        </>
    )
}

export default TutorialTourTip
