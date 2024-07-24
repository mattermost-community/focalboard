// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'

import {FormattedMessage, useIntl} from 'react-intl'

import Search from '../../widgets/icons/search'
import CreateCategory from '../createCategory/createCategory'
import {useAppSelector} from '../../store/hooks'

import {
    getOnboardingTourCategory,
    getOnboardingTourStep,
} from '../../store/users'
import {getCurrentCard} from '../../store/cards'

import './boardsSwitcher.scss'
import BoardSwitcherDialog from '../boardsSwitcherDialog/boardSwitcherDialog'
import {Utils} from '../../utils'
import {Constants} from '../../constants'
import {TOUR_SIDEBAR, SidebarTourSteps} from '../../components/onboardingTour'

import SearchForBoardsTourStep from '../../components/onboardingTour/searchForBoards/searchForBoards'

const BoardsSwitcher = (): JSX.Element => {
    const intl = useIntl()

    const [showSwitcher, setShowSwitcher] = useState<boolean>(false)
    const onboardingTourCategory = useAppSelector(getOnboardingTourCategory)
    const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false)
    const onboardingTourStep = useAppSelector(getOnboardingTourStep)
    const currentCard = useAppSelector(getCurrentCard)
    const noCardOpen = !currentCard

    const shouldViewSearchForBoardsTour = noCardOpen &&
                                       onboardingTourCategory === TOUR_SIDEBAR &&
                                       onboardingTourStep === SidebarTourSteps.SEARCH_FOR_BOARDS.toString()

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
            {shouldViewSearchForBoardsTour && <div><SearchForBoardsTourStep/></div>}
            {
                showSwitcher &&
                <BoardSwitcherDialog onClose={() => setShowSwitcher(false)}/>
            }

            {
                showCreateCategoryModal && (
                    <CreateCategory
                        onClose={() => setShowCreateCategoryModal(false)}
                        title={(
                            <FormattedMessage
                                id='SidebarCategories.CategoryMenu.CreateNew'
                                defaultMessage='Create New Category'
                            />
                        )}
                    />
                )
            }
        </div>
    )
}

export default BoardsSwitcher
