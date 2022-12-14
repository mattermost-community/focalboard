import React from 'react'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import PageProperty from './pageProperty'

import './pageProperties.scss'

type Props = {
    readonly: boolean
    canEditBoardProperties: boolean
    canEditBoardCards: boolean
    board: Board
    newTemplateId: string
    pseudoCard: Card
}

const PageProperties = (props: Props) => {
    return (
        <div className='PageProperties'>
            {props.board.cardProperties.map((propertyTemplate: IPropertyTemplate) => (
                <PageProperty
                    readonly={props.readonly}
                    canEditBoardCards={props.canEditBoardCards}
                    canEditBoardProperties={props.canEditBoardProperties}
                    board={props.board}
                    newTemplateId={props.newTemplateId}
                    pseudoCard={props.pseudoCard}
                    propertyTemplate={propertyTemplate}
                />)
            )}
        </div>
    )
}

export default React.memo(PageProperties)
