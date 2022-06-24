// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect, useState} from 'react'
import {generatePath, useRouteMatch, useHistory} from 'react-router-dom'
import {FormattedMessage} from 'react-intl'

import {debounce} from "lodash"

import {NumberSize, Resizable} from "re-resizable"

import {Direction} from "re-resizable/lib/resizer"

import {getCurrentTeam} from '../store/teams'
import {getCurrentBoard, isLoadingBoard, getTemplates} from '../store/boards'
import {refreshCards, getCardLimitTimestamp, getCurrentBoardHiddenCardsCount, setLimitTimestamp, getCurrentViewCardsSortedFilteredAndGrouped, setCurrent as setCurrentCard} from '../store/cards'
import {
    getCurrentBoardViews,
    getCurrentViewGroupBy,
    getCurrentViewId,
    getCurrentViewDisplayBy,
    getCurrentView
} from '../store/views'
import {useAppSelector, useAppDispatch} from '../store/hooks'

import {getClientConfig, setClientConfig} from '../store/clientConfig'

import wsClient, {WSClient} from '../wsclient'
import {ClientConfig} from '../config/clientConfig'
import {Utils} from '../utils'

import CenterPanel from './centerPanel'
import BoardTemplateSelector from './boardTemplateSelector/boardTemplateSelector'

import './workspace.scss'
import Sidebar from "./sidebar/sidebar"

import {UserConfigPatch} from "../user"
import octoClient from "../octoClient"
import {getMe} from "../store/users"

const lhsDefaultWidth = 240 //pixels
const lhsMinWidth = lhsDefaultWidth
const lhsMaxWidthPercentage = 50


type Props = {
    readonly: boolean
}

function CenterContent(props: Props) {
    const team = useAppSelector(getCurrentTeam)
    const isLoading = useAppSelector(isLoadingBoard)
    const match = useRouteMatch<{boardId: string, viewId: string, cardId?: string}>()
    const board = useAppSelector(getCurrentBoard)
    const templates = useAppSelector(getTemplates)
    const cards = useAppSelector(getCurrentViewCardsSortedFilteredAndGrouped)
    const activeView = useAppSelector(getCurrentView)
    const views = useAppSelector(getCurrentBoardViews)
    const groupByProperty = useAppSelector(getCurrentViewGroupBy)
    const dateDisplayProperty = useAppSelector(getCurrentViewDisplayBy)
    const clientConfig = useAppSelector(getClientConfig)
    const hiddenCardsCount = useAppSelector(getCurrentBoardHiddenCardsCount)
    const cardLimitTimestamp = useAppSelector(getCardLimitTimestamp)
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

        const onCardLimitTimestampChangeHandler = (_: WSClient, timestamp: number) => {
            dispatch(setLimitTimestamp({timestamp, templates}))
            if (cardLimitTimestamp > timestamp) {
                dispatch(refreshCards(timestamp))
            }
        }
        wsClient.addOnCardLimitTimestampChange(onCardLimitTimestampChangeHandler)

        return () => {
            wsClient.removeOnConfigChange(onConfigChangeHandler)
        }
    }, [cardLimitTimestamp, match.params.boardId, templates])

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
                hiddenCardsCount={hiddenCardsCount}
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

    const [width, setWidth] = useState<number>(lhsDefaultWidth)
    const me = useAppSelector(getMe)
    useEffect(() => {
        if (me && me.props.lhsSize) {
            setWidth(parseFloat(me.props.lhsSize))
        }
    }, [me])

    const saveLHSSize = debounce((size: number) => {
        if (!me) {
            return
        }
        octoClient.patchUserConfig(me.id, {
            updatedFields: {
                lhsSize: size.toString(),
            }
        })
    }, 200)

    console.log(`window.innerWidth / 100 * lhsMaxWidthPercentage: ${window.innerWidth / 100 * lhsMaxWidthPercentage} window.innerWidth: ${window.innerWidth}`)
    const [maxWidth, setMaxWidth] = useState<number>(10)
    useEffect(() => {
        console.log(`Setting maxWidth window.innerWidth: ${window.innerWidth}`)
        setMaxWidth(window.innerWidth * 100 / lhsMaxWidthPercentage)
    }, [window.innerWidth])

    const lhsResizeHandle = (event: MouseEvent | TouchEvent, direction: Direction, elementRef: HTMLElement, delta: NumberSize) => {
        if (delta.width === 0) {
            // This happens when you try changing size to beyond min and max width.
            // This check avoid unnecessary user pref save API call.
            return
        }

        const newWidth = width + delta.width
        setWidth(newWidth)
        saveLHSSize(newWidth)
    }

    return (
        <div className='Workspace'>
            {!props.readonly &&
                <Resizable
                    minWidth={lhsMinWidth}
                    maxWidth={'50%'}
                    size={{width: width, height: '100%'}}
                    enable={{right: true}}
                    onResizeStop={lhsResizeHandle}
                >
                    <Sidebar
                        onBoardTemplateSelectorOpen={openBoardTemplateSelector}
                        activeBoardId={board?.id}
                    />
                </Resizable>
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

            <div id='focalboard-rhs-portal'/>
        </div>
    )
}

export default React.memo(Workspace)
