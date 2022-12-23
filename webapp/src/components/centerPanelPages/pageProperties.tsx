// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {Page} from '../../blocks/page'

import PageProperty from './pageProperty'

import './pageProperties.scss'

type Props = {
    readonly: boolean
    canEditBoardProperties: boolean
    canEditBoardCards: boolean
    board: Board
    newTemplateId: string
    page: Page
}

const PageProperties = (props: Props) => {
    return (
        <div className='PageProperties'>
            {props.board.cardProperties.map((propertyTemplate: IPropertyTemplate) => (
                <PageProperty
                    key={props.page.id + propertyTemplate.id}
                    readonly={props.readonly}
                    canEditBoardCards={props.canEditBoardCards}
                    canEditBoardProperties={props.canEditBoardProperties}
                    board={props.board}
                    newTemplateId={props.newTemplateId}
                    page={props.page}
                    propertyTemplate={propertyTemplate}
                />),
            )}
        </div>
    )
}

export default React.memo(PageProperties)
