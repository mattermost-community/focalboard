import React, {useState} from 'react'
import {useIntl} from 'react-intl'

import {Board, IPropertyTemplate} from '../../blocks/board'
import PropertyMenu from '../../widgets/propertyMenu'
import propRegistry from '../../properties'
import {PropertyType} from '../../properties/types'
import mutator from '../../mutator'
import {Utils} from '../../utils'
import MenuWrapper from '../../widgets/menuWrapper'
import {getMySortedPageFolders} from '../../store/boards'
import {useAppSelector} from '../../store/hooks'
import Button from '../../widgets/buttons/button'

import {sendFlashMessage} from '../flashMessages'
import PropertyValueElement from '../propertyValueElement'
import ConfirmationDialogBox, {ConfirmationDialogBoxProps} from '../confirmationDialogBox'

type Props = {
    readonly: boolean
    canEditBoardProperties: boolean
    canEditBoardCards: boolean
    board: Board
    newTemplateId: string
}

const PageProperties = (props: Props) => {
    const intl = useIntl()
    const pages = useAppSelector(getMySortedPageFolders)

    function onPropertyChangeSetAndOpenConfirmationDialog(newType: PropertyType, newName: string, propertyTemplate: IPropertyTemplate) {
        const oldType = propRegistry.get(propertyTemplate.type)

        // do nothing if no change
        if (oldType === newType && propertyTemplate.name === newName) {
            return
        }

        if (oldType === newType) {
            mutator.changePropertyTypeAndName(props.board, pages as any, propertyTemplate, newType.type, newName)
            return
        }

        const subTextString = intl.formatMessage({
            id: 'CardDetailProperty.property-name-change-subtext',
            defaultMessage: 'type from "{oldPropType}" to "{newPropType}"',
        }, {oldPropType: oldType.displayName(intl), newPropType: newType.displayName(intl)})

        setConfirmationDialogBox({
            heading: intl.formatMessage({id: 'CardDetailProperty.confirm-property-type-change', defaultMessage: 'Confirm property type change'}),
            subText: intl.formatMessage({
                id: 'CardDetailProperty.confirm-property-name-change-subtext',
                defaultMessage: 'Are you sure you want to change property "{propertyName}" {customText}?',
            },
            {
                propertyName: propertyTemplate.name,
                customText: subTextString,
            }),

            confirmButtonText: intl.formatMessage({id: 'CardDetailProperty.property-change-action-button', defaultMessage: 'Change property'}),
            onConfirm: async () => {
                setShowConfirmationDialog(false)
                try {
                    await mutator.changePropertyTypeAndName(props.board, pages as any, propertyTemplate, newType.type, newName)
                } catch (err: any) {
                    Utils.logError(`Error Changing Property And Name:${propertyTemplate.name}: ${err?.toString()}`)
                }
                sendFlashMessage({content: intl.formatMessage({id: 'CardDetailProperty.property-changed', defaultMessage: 'Changed property successfully!'}), severity: 'high'})
            },
            onClose: () => setShowConfirmationDialog(false),
        })

        // open confirmation dialog for property type change
        setShowConfirmationDialog(true)
    }

    function onPropertyDeleteSetAndOpenConfirmationDialog(propertyTemplate: IPropertyTemplate) {
        // set ConfirmationDialogBox Props
        setConfirmationDialogBox({
            heading: intl.formatMessage({id: 'CardDetailProperty.confirm-delete-heading', defaultMessage: 'Confirm delete property'}),
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
                    await mutator.deleteProperty(props.board, [], pages as any, propertyTemplate.id)
                    sendFlashMessage({content: intl.formatMessage({id: 'CardDetailProperty.property-deleted', defaultMessage: 'Deleted {propertyName} successfully!'}, {propertyName: deletingPropName}), severity: 'high'})
                } catch (err: any) {
                    Utils.logError(`Error Deleting Property!: Could Not delete Property -" + ${deletingPropName} ${err?.toString()}`)
                }
            },

            onClose: () => setShowConfirmationDialog(false),
        })

        // open confirmation dialog property delete
        setShowConfirmationDialog(true)
    }

    const [confirmationDialogBox, setConfirmationDialogBox] = useState<ConfirmationDialogBoxProps>({heading: '', onConfirm: () => {}, onClose: () => {}})
    const [showConfirmationDialog, setShowConfirmationDialog] = useState<boolean>(false)

    return (
        <div className='PageProperties'>
            {showConfirmationDialog && (
                <ConfirmationDialogBox
                    dialogBox={confirmationDialogBox}
                />
            )}

            {props.board.cardProperties.map((propertyTemplate: IPropertyTemplate) => {
                return (
                    <div
                        key={propertyTemplate.id + '-' + propertyTemplate.type}
                        className='octo-propertyrow'
                    >
                        {(props.readonly || !props.canEditBoardProperties) && <div className='octo-propertyname octo-propertyname--readonly'>{propertyTemplate.name}</div>}
                        {!props.readonly && props.canEditBoardProperties &&
                            <MenuWrapper isOpen={propertyTemplate.id === props.newTemplateId}>
                                <div className='octo-propertyname'><Button>{propertyTemplate.name}</Button></div>
                                <PropertyMenu
                                    propertyId={propertyTemplate.id}
                                    propertyName={propertyTemplate.name}
                                    propertyType={propRegistry.get(propertyTemplate.type)}
                                    onTypeAndNameChanged={(newType: PropertyType, newName: string) => onPropertyChangeSetAndOpenConfirmationDialog(newType, newName, propertyTemplate)}
                                    onDelete={() => onPropertyDeleteSetAndOpenConfirmationDialog(propertyTemplate)}
                                />
                            </MenuWrapper>
                        }
                        <PropertyValueElement
                            readOnly={props.readonly || !props.canEditBoardCards}
                            card={pseudoCard}
                            board={props.board}
                            propertyTemplate={propertyTemplate}
                            showEmptyPlaceholder={true}
                        />
                    </div>
                )
            })}
        </div>
    )
}

export default React.memo(PageProperties)
