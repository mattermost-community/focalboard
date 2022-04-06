// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect, useState} from 'react'
import {generatePath, useRouteMatch, useHistory} from 'react-router-dom'
import {FormattedMessage} from 'react-intl'

import {getCurrentTeam} from '../store/teams'
import {getCurrentBoard, isLoadingBoard} from '../store/boards'
import {getCurrentViewCardsSortedFilteredAndGrouped, setCurrent as setCurrentCard} from '../store/cards'
import {getView, getCurrentBoardViews, getCurrentViewGroupBy, getCurrentViewId, getCurrentViewDisplayBy} from '../store/views'
import {useAppSelector, useAppDispatch} from '../store/hooks'

import {getClientConfig, setClientConfig} from '../store/clientConfig'

import wsClient, {WSClient} from '../wsclient'
import {ClientConfig} from '../config/clientConfig'
import {Utils} from '../utils'

import CenterPanel from './centerPanel'
import BoardTemplateSelector from './boardTemplateSelector/boardTemplateSelector'

import Sidebar from './sidebar/sidebar'
import './workspace.scss'

type Props = {
    readonly: boolean
}

function CenterContent(props: Props) {
    const team = useAppSelector(getCurrentTeam)
    const isLoading = useAppSelector(isLoadingBoard)
    const match = useRouteMatch<{boardId: string, viewId: string, cardId?: string}>()
    const board = useAppSelector(getCurrentBoard)
    const cards = useAppSelector(getCurrentViewCardsSortedFilteredAndGrouped)
    const activeView = useAppSelector(getView(match.params.viewId))
    const views = useAppSelector(getCurrentBoardViews)
    const groupByProperty = useAppSelector(getCurrentViewGroupBy)
    const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy)
    const clientConfig = useAppSelector(getClientConfig)
    const history = useHistory()
    const dispatch = useAppDispatch()

    const showCard = useCallback((cardId?: string) => {
        const params = {...match.params, cardId}
        let newPath = generatePath(match.path, params)
        if (props.readonly) {
            newPath += `?r=${Utils.getReadToken()}`
        }
        history.push(newPath)
        dispatch(setCurrentCard(cardId || ''))
    }, [match, history])

    useEffect(() => {
        const onConfigChangeHandler = (_: WSClient, config: ClientConfig) => {
            dispatch(setClientConfig(config))
        }
        wsClient.addOnConfigChange(onConfigChangeHandler)
        return () => {
            wsClient.removeOnConfigChange(onConfigChangeHandler)
        }
    }, [])

    if (board && activeView) {
        let property = groupByProperty
        if ((!property || property.type !== 'select') && activeView.fields.viewType === 'board') {
            property = board?.cardProperties.find((o) => o.type === 'select')
        }

        let displayProperty = dateDisplayProperty
        if (!displayProperty && activeView.fields.viewType === 'calendar') {
            displayProperty = board.cardProperties.find((o) => o.type === 'date')
        }

        return (
            <CenterPanel
                clientConfig={clientConfig}
                readonly={props.readonly}
                board={board}
                cards={cards}
                shownCardId={match.params.cardId}
                showCard={showCard}
                activeView={activeView}
                groupByProperty={property}
                dateDisplayProperty={displayProperty}
                views={views}
            />
        )
    }

    if (board || isLoading) {
        return null
    }

    return (
        <BoardTemplateSelector
            title={
                <FormattedMessage
                    id='BoardTemplateSelector.plugin.no-content-title'
                    defaultMessage='Create a Board in {teamName}'
                    values={{teamName: team?.title}}
                />
            }
            description={
                <FormattedMessage
                    id='BoardTemplateSelector.plugin.no-content-description'
                    defaultMessage='Add a board to the sidebar using any of the templates defined below or start from scratch.{lineBreak} Members of "{teamName}" will have access to boards created here.'
                    values={{
                        teamName: <b>{team?.title}</b>,
                        lineBreak: <br/>,
                    }}
                />
            }
        />
    )
}

const Workspace = (props: Props) => {
    const board = useAppSelector(getCurrentBoard)

    const viewId = useAppSelector(getCurrentViewId)
    const [boardTemplateSelectorOpen, setBoardTemplateSelectorOpen] = useState(false)

    const closeBoardTemplateSelector = useCallback(() => {
        setBoardTemplateSelectorOpen(false)
    }, [])
    const openBoardTemplateSelector = useCallback(() => {
        setBoardTemplateSelectorOpen(true)
    }, [])
    useEffect(() => {
        setBoardTemplateSelectorOpen(false)
    }, [board, viewId])

    return (
        <div className='Workspace'>
            {!props.readonly &&
                <Sidebar
                    onBoardTemplateSelectorOpen={openBoardTemplateSelector}
                    activeBoardId={board?.id}
                />
            }
            <div className='mainFrame'>
                {boardTemplateSelectorOpen &&
                    <BoardTemplateSelector onClose={closeBoardTemplateSelector}/>}
                {(board?.isTemplate) &&
                <div className='banner'>
                    <FormattedMessage
                        id='Workspace.editing-board-template'
                        defaultMessage="You're editing a board template."
                    />
                </div>}
                <CenterContent
                    readonly={props.readonly}
                />
            </div>
        </div>
    )
}

export default React.memo(Workspace)
