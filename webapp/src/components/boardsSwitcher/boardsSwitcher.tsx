// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useCallback} from 'react'

import {useIntl} from 'react-intl'

import {generatePath, useRouteMatch, useHistory} from 'react-router-dom'

import Search from '../../widgets/icons/search'

import './boardsSwitcher.scss'
import AddIcon from '../../widgets/icons/add'
import BoardSwitcherDialog from '../boardsSwitcherDialog/boardSwitcherDialog'
import {UserSettings} from '../../userSettings'
import {addBoardClicked} from '../sidebar/sidebarAddBoardMenu'
import {setCurrent as setCurrentBoard, getCurrentBoard} from '../../store/boards'
import {setCurrent as setCurrentView} from '../../store/views'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {Utils} from '../../utils'
import {getCurrentTeam} from '../../store/teams'

const BoardsSwitcher = (): JSX.Element => {
    const intl = useIntl()
    const team = useAppSelector(getCurrentTeam)
    const board = useAppSelector(getCurrentBoard)

    const [showSwitcher, setShowSwitcher] = useState<boolean>(false)

    // Disabling this for now as Cmd+K
    // is being used by Firefox for activating
    // Search Bar. Unable to prevent browser default right now.
    // It doesn't work when the search input has the focus.
    //
    // useHotkeys('ctrl+k,cmd+k',
    //     (e) => {
    //         e.preventDefault()
    //         setShowSwitcher((show) => !show)
    //     },
    //     {
    //         filter: () => {
    //             console.log('filter called')
    //             return true
    //         },
    //         enableOnTags: ['INPUT'],
    //         filterPreventDefault: true,
    //     },
    //     [showSwitcher],
    // )

    const dispatch = useAppDispatch()
    const history = useHistory()
    const match = useRouteMatch<{boardId: string, viewId?: string}>()

    const goToEmptyCenterPanel = () => {
        UserSettings.setLastBoardID(team?.id || '', '')

        // TODO see if this works or do we need a solution
        dispatch(setCurrentBoard(''))
        dispatch(setCurrentView(''))
        history.replace(`/team/${team?.id}`)
    }

    const showBoard = useCallback((boardId) => {
        const params = {...match.params, boardId: boardId || ''}
        delete params.viewId
        const newPath = generatePath(match.path, params)
        history.push(newPath)
    }, [match, history])

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
                <span
                    className='add-board-icon'
                    onClick={() => addBoardClicked(showBoard, intl, board?.id)}
                >
                    <AddIcon/>
                </span>
            }

            {
                showSwitcher &&
                <BoardSwitcherDialog onClose={() => setShowSwitcher(false)}/>
            }
        </div>
    )
}

export default BoardsSwitcher
