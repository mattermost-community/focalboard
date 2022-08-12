// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'

import {useIntl} from 'react-intl'

import Search from '../../widgets/icons/search'

import {useAppSelector} from '../../store/hooks'

import {
    getOnboardingTourCategory,
    getOnboardingTourStep,
} from '../../store/users'

import {getCurrentCard} from '../../store/cards'

import './boardsSwitcher.scss'
import AddIcon from '../../widgets/icons/add'
import BoardSwitcherDialog from '../boardsSwitcherDialog/boardSwitcherDialog'
import {Utils} from '../../utils'
import {Constants} from '../../constants'
import {TOUR_SIDEBAR, SidebarTourSteps} from '../../components/onboardingTour'

import IconButton from '../../widgets/buttons/iconButton'

type Props = {
    onBoardTemplateSelectorOpen?: () => void,
}

const BoardsSwitcher = (props: Props): JSX.Element => {
    const intl = useIntl()

    const [showSwitcher, setShowSwitcher] = useState<boolean>(false)
    const onboardingTourCategory = useAppSelector(getOnboardingTourCategory)
    const onboardingTourStep = useAppSelector(getOnboardingTourStep)
    const currentCard = useAppSelector(getCurrentCard)
    const noCardOpen = !currentCard


    const shouldViewSearchForBoardsTour = noCardOpen &&
                                       onboardingTourCategory === TOUR_SIDEBAR &&
                                       onboardingTourStep === SidebarTourSteps.SEARCH_FOR_BOARDS.toString()

    useEffect(() => {
        if(shouldViewSearchForBoardsTour) {
            setShowSwitcher(true)
        }

        return () => {
            setShowSwitcher(false)
        }
    }, [shouldViewSearchForBoardsTour])


    // We need this keyboard handling (copied from Mattermost webapp) instead of
    // using react-hotkeys-hook as react-hotkeys-hook is unable to handle keyboard shortcuts that
    // the browser uses when the user is focused in an input field.
    //
    // For example, you press Cmd + k, then type something in the search input field. Pressing Cmd + k again
    // is expected to close the board switcher, however, with react-hotkeys-hook it doesn't.
    // This is because Cmd + k is a Firefox shortcut and react-hotkeys-hook is
    // unable to override it if the user is focused on any input field.
    const handleQuickSwitchKeyPress = (e: KeyboardEvent) => {
        if (Utils.cmdOrCtrlPressed(e) && !e.shiftKey && Utils.isKeyPressed(e, Constants.keyCodes.K)) {
            if (!e.altKey) {
                e.preventDefault()
                setShowSwitcher((show) => !show)
            }
        }
    }

    const handleEscKeyPress = (e: KeyboardEvent) => {
        if (Utils.isKeyPressed(e, Constants.keyCodes.ESC)) {
            e.preventDefault()
            setShowSwitcher(false)
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', handleQuickSwitchKeyPress)
        document.addEventListener('keydown', handleEscKeyPress)

        // cleanup function
        return () => {
            document.removeEventListener('keydown', handleQuickSwitchKeyPress)
            document.removeEventListener('keydown', handleEscKeyPress)
        }
    }, [])

    return (
        <div className='BoardsSwitcherWrapper'>
            <div
                className='BoardsSwitcher'
                onClick={() => setShowSwitcher(true)}
            >
                <Search/>
                <div>
                    <span>
                        {intl.formatMessage({id: 'BoardsSwitcher.Title', defaultMessage: 'Find Boards'})}
                    </span>
                </div>
            </div>

            {
                Utils.isFocalboardPlugin() &&
                <IconButton
                    size='small'
                    inverted={true}
                    className='add-board-icon'
                    onClick={props.onBoardTemplateSelectorOpen}
                    icon={<AddIcon/>}
                />
            }

            {
                showSwitcher &&
                <BoardSwitcherDialog onClose={() => setShowSwitcher(false)} shouldViewSearchForBoardsTour={shouldViewSearchForBoardsTour}/>
            }
        </div>
    )
}

export default BoardsSwitcher
