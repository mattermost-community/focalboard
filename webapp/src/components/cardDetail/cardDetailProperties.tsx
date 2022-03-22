// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Board, IPropertyTemplate, PropertyType} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {BoardView} from '../../blocks/boardView'

import mutator from '../../mutator'
import Button from '../../widgets/buttons/button'
import MenuWrapper from '../../widgets/menuWrapper'
import PropertyMenu, {PropertyTypes, typeDisplayName} from '../../widgets/propertyMenu'

import Calculations from '../calculations/calculations'
import PropertyValueElement from '../propertyValueElement'
import ConfirmationDialogBox, {ConfirmationDialogBoxProps} from '../confirmationDialogBox'
import {sendFlashMessage} from '../flashMessages'
import Menu from '../../widgets/menu'
import {IDType, Utils} from '../../utils'
import AddPropertiesTourStep from '../onboardingTour/addProperties/add_properties'
import {Permission} from '../../constants'
import {useHasCurrentBoardPermissions} from '../../hooks/permissions'

type Props = {
    board: Board
    card: Card
    cards: Card[]
    activeView: BoardView
    views: BoardView[]
    readonly: boolean
}

const CardDetailProperties = (props: Props) => {
    const {board, card, cards, views, activeView} = props
    const [newTemplateId, setNewTemplateId] = useState('')
    const canEditBoardProperties = useHasCurrentBoardPermissions([Permission.ManageBoardProperties])
    const canEditBoardCards = useHasCurrentBoardPermissions([Permission.ManageBoardCards])
    const intl = useIntl()

    useEffect(() => {
        const newProperty = board.cardProperties.find((property) => property.id === newTemplateId)
        if (newProperty) {
            setNewTemplateId('')
        }
    }, [newTemplateId, board.cardProperties])

    const [confirmationDialogBox, setConfirmationDialogBox] = useState<ConfirmationDialogBoxProps>({heading: '', onConfirm: () => {}, onClose: () => {}})
    const [showConfirmationDialog, setShowConfirmationDialog] = useState<boolean>(false)

    function onPropertyChangeSetAndOpenConfirmationDialog(newType: PropertyType, newName: string, propertyTemplate:IPropertyTemplate) {
        const oldType = propertyTemplate.type

        // do nothing if no change
        if (oldType === newType && propertyTemplate.name === newName) {
            return
        }

        const affectsNumOfCards:string = Calculations.countNotEmpty(cards, propertyTemplate, intl)

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
            onConfirm: async () => {
                setShowConfirmationDialog(false)
                try {
                    await mutator.changePropertyTypeAndName(board, cards, propertyTemplate, newType, newName)
                } catch (err:any) {
                    Utils.logError(`Error Changing Property And Name:${propertyTemplate.name}: ${err?.toString()}`)
                }
                sendFlashMessage({content: intl.formatMessage({id: 'CardDetailProperty.property-changed', defaultMessage: 'Changed property successfully!'}), severity: 'high'})
            },
            onClose: () => setShowConfirmationDialog(false),
        })

        // open confirmation dialog for property type or name change
        setShowConfirmationDialog(true)
    }

    function onPropertyDeleteSetAndOpenConfirmationDialog(propertyTemplate:IPropertyTemplate) {
        // set ConfirmationDialogBox Props
        setConfirmationDialogBox({
            heading: intl.formatMessage({id: 'CardDetailProperty.confirm-delete-heading', defaultMessage: 'Confirm Delete Property'}),
            subText: intl.formatMessage({
                id: 'CardDetailProperty.confirm-delete-subtext',
                defaultMessage: 'Are you sure you want to delete the property "{propertyName}"? Deleting it will delete the property from all cards in this board.',
            },
            {propertyName: propertyTemplate.name}),
            confirmButtonText: intl.formatMessage({id: 'CardDetailProperty.delete-action-button', defaultMessage: 'Delete'}),
            onConfirm: async () => {
                const deletingPropName = propertyTemplate.name
                setShowConfirmationDialog(false)
                try {
                    await mutator.deleteProperty(board, views, cards, propertyTemplate.id)
                    sendFlashMessage({content: intl.formatMessage({id: 'CardDetailProperty.property-deleted', defaultMessage: 'Deleted {propertyName} Successfully!'}, {propertyName: deletingPropName}), severity: 'high'})
                } catch (err:any) {
                    Utils.logError(`Error Deleting Property!: Could Not delete Property -" + ${deletingPropName} ${err?.toString()}`)
                }
            },

            onClose: () => setShowConfirmationDialog(false),
        })

        // open confirmation dialog property delete
        setShowConfirmationDialog(true)
    }

    return (
        <div className='octo-propertylist CardDetailProperties'>
            {board.cardProperties.map((propertyTemplate: IPropertyTemplate) => {
                return (
                    <div
                        key={propertyTemplate.id + '-' + propertyTemplate.type}
                        className='octo-propertyrow'
                    >
                        {(props.readonly || !canEditBoardProperties) && <div className='octo-propertyname octo-propertyname--readonly'>{propertyTemplate.name}</div>}
                        {!props.readonly && canEditBoardProperties &&
                            <MenuWrapper isOpen={propertyTemplate.id === newTemplateId}>
                                <div className='octo-propertyname'><Button>{propertyTemplate.name}</Button></div>
                                <PropertyMenu
                                    propertyId={propertyTemplate.id}
                                    propertyName={propertyTemplate.name}
                                    propertyType={propertyTemplate.type}
                                    onTypeAndNameChanged={(newType: PropertyType, newName: string) => onPropertyChangeSetAndOpenConfirmationDialog(newType, newName, propertyTemplate)}
                                    onDelete={() => onPropertyDeleteSetAndOpenConfirmationDialog(propertyTemplate)}
                                />
                            </MenuWrapper>
                        }
                        <PropertyValueElement
                            readOnly={props.readonly || !canEditBoardCards}
                            card={card}
                            board={board}
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

            {!props.readonly && canEditBoardProperties &&
                <div className='octo-propertyname add-property'>
                    <MenuWrapper>
                        <Button>
                            <FormattedMessage
                                id='CardDetail.add-property'
                                defaultMessage='+ Add a property'
                            />
                        </Button>
                        <Menu>
                            <PropertyTypes
                                label={intl.formatMessage({id: 'PropertyMenu.selectType', defaultMessage: 'Select property type'})}
                                onTypeSelected={async (type) => {
                                    const template: IPropertyTemplate = {
                                        id: Utils.createGuid(IDType.BlockID),
                                        name: typeDisplayName(intl, type),
                                        type,
                                        options: [],
                                    }
                                    const templateId = await mutator.insertPropertyTemplate(board, activeView, -1, template)
                                    setNewTemplateId(templateId)
                                }}
                            />
                        </Menu>
                    </MenuWrapper>

                    <AddPropertiesTourStep/>
                </div>
            }
        </div>
    )
}

export default React.memo(CardDetailProperties)
