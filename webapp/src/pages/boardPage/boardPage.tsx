// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState, useMemo, useCallback} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {useRouteMatch} from 'react-router-dom'

import Workspace from '../../components/workspace'
import CloudMessage from '../../components/messages/cloudMessage'
import octoClient from '../../octoClient'
import {Utils} from '../../utils'
import wsClient from '../../wsclient'
import {getCurrentBoardId, setCurrent as setCurrentBoard, fetchBoardMembers} from '../../store/boards'
import {getCurrentViewId, setCurrent as setCurrentView} from '../../store/views'
import {initialLoad, initialReadOnlyLoad, loadBoardData} from '../../store/initialLoad'
import {useAppSelector, useAppDispatch} from '../../store/hooks'
import {setGlobalError} from '../../store/globalError'
import {UserSettings} from '../../userSettings'

import IconButton from '../../widgets/buttons/iconButton'
import CloseIcon from '../../widgets/icons/close'

import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import {fetchUserBlockSubscriptions, getMe} from '../../store/users'
import {IUser} from '../../user'

import {Constants} from "../../constants"

import SetWindowTitleAndIcon from './setWindowTitleAndIcon'
import TeamToBoardAndViewRedirect from './teamToBoardAndViewRedirect'
import UndoRedoHotKeys from './undoRedoHotKeys'
import BackwardCompatibilityQueryParamsRedirect from './backwardCompatibilityQueryParamsRedirect'
import WebsocketConnection from './websocketConnection'

import './boardPage.scss'

type Props = {
    readonly?: boolean
}

const BoardPage = (props: Props): JSX.Element => {
    const intl = useIntl()
    const activeBoardId = useAppSelector(getCurrentBoardId)
    const activeViewId = useAppSelector(getCurrentViewId)
    const dispatch = useAppDispatch()
    const match = useRouteMatch<{boardId: string, viewId: string, cardId?: string, teamId?: string}>()
    const [mobileWarningClosed, setMobileWarningClosed] = useState(UserSettings.mobileWarningClosed)
    const teamId = match.params.teamId || UserSettings.lastTeamId || Constants.globalTeamId
    const me = useAppSelector<IUser|null>(getMe)

    // if we're in a legacy route and not showing a shared board,
    // redirect to the new URL schema equivalent
    if (Utils.isFocalboardLegacy() && !props.readonly) {
        window.location.href = window.location.href.replace('/plugins/focalboard', '/boards')
    }

    // Load user's block subscriptions when workspace changes
    // block subscriptions are relevant only in plugin mode.
    if (Utils.isFocalboardPlugin()) {
        useEffect(() => {
            if (!me) {
                return
            }
            dispatch(fetchUserBlockSubscriptions(me!.id))
        }, [me?.id])
    }

    // TODO: Make this less brittle. This only works because this is the root render function
    useEffect(() => {
        UserSettings.lastTeamId = teamId
        octoClient.teamId = teamId
        wsClient.teamId = teamId
        const windowAny = (window as any)
        if (windowAny.setTeamInSidebar) {
            windowAny.setTeamInSidebar(teamId)
        }
    }, [teamId])

    const loadAction: (boardId: string) => any = useMemo(() => {
        if (props.readonly) {
            return initialReadOnlyLoad
        }
        return initialLoad
    }, [props.readonly])

    const loadOrJoinBoard = useCallback(async (userId: string, boardTeamId: string, boardId: string) => {
        // and fetch its data
        const result: any = await dispatch(loadBoardData(boardId))
        if (result.payload.blocks.length === 0 && userId) {
            const member = await octoClient.joinBoard(boardId)
            if (!member) {
                UserSettings.setLastBoardID(boardTeamId, null)
                UserSettings.setLastViewId(boardId, null)
                dispatch(setGlobalError('board-not-found'))
                return
            }
            await dispatch(loadBoardData(boardId))
        }

        dispatch(fetchBoardMembers({
            teamId: boardTeamId,
            boardId,
        }))
    }, [])

    useEffect(() => {
        dispatch(loadAction(match.params.boardId))

        if (match.params.boardId) {
            // set the active board
            dispatch(setCurrentBoard(match.params.boardId))

            // and set it as most recently viewed board
            UserSettings.setLastBoardID(teamId, match.params.boardId)

            if (match.params.viewId && match.params.viewId !== Constants.globalTeamId) {
                dispatch(setCurrentView(match.params.viewId))
                UserSettings.setLastViewId(match.params.boardId, match.params.viewId)
            }

            if (!props.readonly && me) {
                loadOrJoinBoard(me.id, teamId, match.params.boardId)
            }
        }
    }, [teamId, match.params.boardId, match.params.viewId, me?.id])

    if (props.readonly) {
        useEffect(() => {
            if (activeBoardId && activeViewId) {
                TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ViewSharedBoard, {board: activeBoardId, view: activeViewId})
            }
        }, [activeBoardId, activeViewId])
    }

    return (
        <div className='BoardPage'>
            <TeamToBoardAndViewRedirect/>
            <BackwardCompatibilityQueryParamsRedirect/>
            <SetWindowTitleAndIcon/>
            <UndoRedoHotKeys/>
            <WebsocketConnection
                teamId={teamId}
                boardId={match.params.boardId}
                readonly={props.readonly || false}
                loadAction={loadAction}
            />
            <CloudMessage/>

            {!mobileWarningClosed &&
                <div className='mobileWarning'>
                    <div>
                        <FormattedMessage
                            id='Error.mobileweb'
                            defaultMessage='Mobile web support is currently in early beta. Not all functionality may be present.'
                        />
                    </div>
                    <IconButton
                        onClick={() => {
                            UserSettings.mobileWarningClosed = true
                            setMobileWarningClosed(true)
                        }}
                        icon={<CloseIcon/>}
                        title='Close'
                        className='margin-right'
                    />
                </div>}

            {props.readonly && activeBoardId === undefined &&
                <div className='error'>
                    {intl.formatMessage({id: 'BoardPage.syncFailed', defaultMessage: 'Board may be deleted or access revoked.'})}
                </div>}

            {

                // Don't display Templates page
                // if readonly mode and no board defined.
                (!props.readonly || activeBoardId !== undefined) &&
                <Workspace
                    readonly={props.readonly || false}
                />
            }
        </div>
    )
}

export default BoardPage
