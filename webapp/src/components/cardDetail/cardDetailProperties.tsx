// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'

import {Board, PropertyType, IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {BoardView} from '../../blocks/boardView'
import {ContentBlock} from '../../blocks/contentBlock'
import {CommentBlock} from '../../blocks/commentBlock'

import mutator from '../../mutator'
import Button from '../../widgets/buttons/button'
import MenuWrapper from '../../widgets/menuWrapper'
import PropertyMenu from '../../widgets/propertyMenu'

import Calculations from '../calculations/calculations'
import PropertyValueElement from '../propertyValueElement'
import {ConfirmationDialogBox, ConfirmationDialogBoxProps} from '../confirmationDialogBox'
import {sendFlashMessage} from '../flashMessages'

type Props = {
    board: Board
    card: Card
    cards: Card[]
    contents: Array<ContentBlock|ContentBlock[]>
    comments: CommentBlock[]
    activeView: BoardView
    views: BoardView[]
    readonly: boolean
}

const CardDetailProperties = React.memo((props: Props) => {
    const intl = useIntl()
    const {board, card, cards, views, activeView, contents, comments} = props

    const [confirmationDialogBox, setConfirmationDialogBox] = useState<ConfirmationDialogBoxProps>({heading: '', onConfirm: () => {}, onClose: () => {}})
    const [showConfirmationDialog, setShowConfirmationDialog] = useState<boolean>(false)

    return (
        <div className='octo-propertylist CardDetailProperties'>
            {board.fields.cardProperties.map((propertyTemplate: IPropertyTemplate) => {
                const propertyValue = card.fields.properties[propertyTemplate.id]
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
                                    onTypeAndNameChanged={(newType: PropertyType, newName: string) => {
                                        const oldType = propertyTemplate.type

                                        // do nothing if no change
                                        if (oldType === newType && propertyTemplate.name === newName) {
                                            return
                                        }

                                        const affectsNumOfCards:string = Calculations.countCardWithPropValueNotNull(cards, propertyTemplate, intl)

                                        // if no card has this value set delete the property directly without warning
                                        if (affectsNumOfCards === '0') {
                                            mutator.changePropertyTypeAndName(board, cards, propertyTemplate, newType, newName)
                                            return
                                        }

                                        let subTextString = intl.formatMessage({
                                            id: 'CardDetailProperty.property-name-change-subtext',
                                            defaultMessage: 'type from "{oldPropType}" to "{newPropType}"',
                                        }, {oldPropType: oldType, newPropType: newType})

                                        if (propertyTemplate.name !== newName) {
                                            subTextString = intl.formatMessage({
                                                id: 'CardDetailProperty.property-type-change-subtext',
                                                defaultMessage: 'name to "{newPropName}"',
                                            }, {newPropName: newName})
                                        }

                                        setConfirmationDialogBox({
                                            heading: intl.formatMessage({id: 'CardDetailProperty.confirm-property-type-change', defaultMessage: 'Confirm Property Type Change!'}),
                                            subText: intl.formatMessage({
                                                id: 'CardDetailProperty.confirm-property-name-change-subtext',
                                                defaultMessage: 'Are you sure you want to change property "{propertyName}" {customText}? This will affect value(s) across {numOfCards} card(s) in this board, and can result in data loss.',
                                            },
                                            {
                                                propertyName: propertyTemplate.name,
                                                customText: subTextString,
                                                numOfCards: affectsNumOfCards,
                                            }),

                                            confirmButtonText: intl.formatMessage({id: 'CardDetailProperty.property-change-action-button', defaultMessage: 'Change Property'}),
                                            onConfirm: () => {
                                                mutator.changePropertyTypeAndName(board, cards, propertyTemplate, newType, newName)
                                                setShowConfirmationDialog(false)
                                                sendFlashMessage({content: intl.formatMessage({id: 'CardDetailProperty.property-changed', defaultMessage: 'Changed property successfully!'}), severity: 'high'})
                                            },
                                            onClose: () => setShowConfirmationDialog(false),
                                        })

                                        setShowConfirmationDialog(true)
                                    }}
                                    onDelete={(id: string) => {
                                        // set ConfirmationDialogBox Props
                                        setConfirmationDialogBox({
                                            heading: intl.formatMessage({id: 'CardDetailProperty.confirm-delete-heading', defaultMessage: 'Confirm Delete Property'}),
                                            subText: intl.formatMessage({
                                                id: 'CardDetailProperty.confirm-delete-subtext',
                                                defaultMessage: 'Are you sure you want to delete the property "{propertyName}"? Deleting it will delete the property from all cards in this board.',
                                            },
                                            {propertyName: propertyTemplate.name}),
                                            confirmButtonText: intl.formatMessage({id: 'CardDetailProperty.delete-action-button', defaultMessage: 'Delete'}),
                                            onConfirm: () => {
                                                const deletingPropName = propertyTemplate.name
                                                mutator.deleteProperty(board, views, cards, id)
                                                setShowConfirmationDialog(false)
                                                sendFlashMessage({content: intl.formatMessage({id: 'CardDetailProperty.property-deleted', defaultMessage: 'Deleted {propertyName} Successfully!'}, {propertyName: deletingPropName}), severity: 'high'})
                                            },

                                            onClose: () => setShowConfirmationDialog(false),
                                        })

                                        setShowConfirmationDialog(true)
                                    }}
                                />
                            </MenuWrapper>
                        }
                        <PropertyValueElement
                            readOnly={props.readonly}
                            card={card}
                            board={board}
                            contents={contents}
                            comments={comments}
                            propertyTemplate={propertyTemplate}
                            showEmptyPlaceholder={true}
                        />
                    </div>
                )
            })}

            {showConfirmationDialog && (
                <ConfirmationDialogBox
                    dialogBox={confirmationDialogBox}
                />
            )}

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
