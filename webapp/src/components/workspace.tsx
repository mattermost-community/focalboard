// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useRouteMatch} from 'react-router-dom'
import {FormattedMessage} from 'react-intl'

import {getCurrentBoard} from '../store/boards'
import {getCurrentBoardCards} from '../store/cards'
import {getView, getCurrentBoardViews} from '../store/views'
import {useAppSelector} from '../store/hooks'
import {Utils} from '../utils'

import CenterPanel from './centerPanel'
import EmptyCenterPanel from './emptyCenterPanel'
import Sidebar from './sidebar/sidebar'
import './workspace.scss'

type Props = {
    readonly: boolean
}

function CenterContent(props: Props) {
    const match = useRouteMatch<{boardId: string, viewId: string}>()
    const board = useAppSelector(getCurrentBoard)
    const cards = useAppSelector(getCurrentBoardCards)
    const activeView = useAppSelector(getView(match.params.viewId))
    const views = useAppSelector(getCurrentBoardViews)

    if (board && activeView) {
        let property = board?.fields.cardProperties.find((o) => o.id === activeView.fields.groupById)
        if (!property || property.type !== 'select') {
            property = board?.fields.cardProperties.find((o) => o.type === 'select')
            Utils.assertValue(property)
        }
        return (
            <CenterPanel
                readonly={props.readonly}
                board={board}
                cards={cards}
                activeView={activeView}
                groupByProperty={property}
                views={views}
            />
        )
    }

    return (
        <EmptyCenterPanel/>
    )
}

const Workspace = React.memo((props: Props) => {
    const board = useAppSelector(getCurrentBoard)

    return (
        <div className='Workspace'>
            {!props.readonly &&
                <Sidebar activeBoardId={board?.id}/>
            }
            <div className='mainFrame'>
                {(board?.fields.isTemplate) &&
                <div className='banner'>
                    <FormattedMessage
                        id='Workspace.editing-board-template'
                        defaultMessage="You're editing a board template"
                    />
                </div>}
                <CenterContent readonly={props.readonly}/>
            </div>
        </div>
    )
})

export default Workspace
