// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {PropertyType} from '../../blocks/board'
import mutator from '../../mutator'
import {BoardTree} from '../../viewModel/boardTree'
import {CardTree} from '../../viewModel/cardTree'
import Button from '../../widgets/buttons/button'
import MenuWrapper from '../../widgets/menuWrapper'
import PropertyMenu from '../../widgets/propertyMenu'

import PropertyValueElement from '../propertyValueElement'

type Props = {
    boardTree: BoardTree
    cardTree: CardTree
    readonly: boolean
}

const CardDetailProperties = React.memo((props: Props) => {
    const {boardTree, cardTree} = props
    const {board} = boardTree
    const {card} = cardTree

    return (
        <div className='octo-propertylist'>
            {board.cardProperties.map((propertyTemplate) => {
                const propertyValue = card.properties[propertyTemplate.id]
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
                                    onTypeAndNameChanged={(newType: PropertyType, newName: string) => mutator.changePropertyTypeAndName(boardTree, propertyTemplate, newType, newName)}
                                    onDelete={(id: string) => mutator.deleteProperty(boardTree, id)}
                                />
                            </MenuWrapper>
                        }
                        <PropertyValueElement
                            readOnly={props.readonly}
                            card={card}
                            boardTree={boardTree}
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
                            await mutator.insertPropertyTemplate(boardTree)
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
