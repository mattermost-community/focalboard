// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {Board, PropertyType} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {BoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import Button from '../../widgets/buttons/button'
import MenuWrapper from '../../widgets/menuWrapper'
import PropertyMenu from '../../widgets/propertyMenu'

import PropertyValueElement from '../propertyValueElement'

type Props = {
    board: Board
    card: Card
    cards: Card[]
    activeView: BoardView
    views: BoardView[]
    readonly: boolean
}

const CardDetailProperties = React.memo((props: Props) => {
    const {board, card, cards, views, activeView} = props

    return (
        <div className='octo-propertylist'>
            {board.cardProperties.map((propertyTemplate) => {
                const propertyValue = card.fields[propertyTemplate.id]
                return (
                    <div
                        key={propertyTemplate.id + '-' + propertyTemplate.type + '-' + propertyValue}
                        className='octo-propertyrow'
                    >
                        {props.readonly && <div className='octo-propertyname'>{propertyTemplate.name}</div>}
                        {!props.readonly &&
                            <MenuWrapper>
                                <div className='octo-propertyname'><Button>{propertyTemplate.name}</Button></div>
                                <PropertyMenu
                                    propertyId={propertyTemplate.id}
                                    propertyName={propertyTemplate.name}
                                    propertyType={propertyTemplate.type}
                                    onTypeAndNameChanged={(newType: PropertyType, newName: string) => mutator.changePropertyTypeAndName(board, cards, propertyTemplate, newType, newName)}
                                    onDelete={(id: string) => mutator.deleteProperty(board, views, cards, id)}
                                />
                            </MenuWrapper>
                        }
                        <PropertyValueElement
                            readOnly={props.readonly}
                            card={card}
                            board={board}
                            propertyTemplate={propertyTemplate}
                            emptyDisplayValue='Empty'
                        />
                    </div>
                )
            })}

            {!props.readonly &&
                <div className='octo-propertyname add-property'>
                    <Button
                        onClick={async () => {
                            // TODO: Show UI
                            await mutator.insertPropertyTemplate(board, activeView)
                        }}
                    >
                        <FormattedMessage
                            id='CardDetail.add-property'
                            defaultMessage='+ Add a property'
                        />
                    </Button>
                </div>
            }
        </div>
    )
})

export default CardDetailProperties
