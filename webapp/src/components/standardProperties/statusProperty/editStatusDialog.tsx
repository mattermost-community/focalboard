// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {DragDropContext, Droppable, DropResult} from 'react-beautiful-dnd'

import {cloneDeep} from 'lodash'

import Tooltip from '../../../widgets/tooltip'

import PlusIcon from '../../../widgets/icons/plus'

import InfoIcon from '../../../widgets/icons/info'

import './editStatusDialog.scss'
import ActionDialog from '../../actionDialog/actionDialog'
import {IPropertyOption} from '../../../blocks/board'

import {IDType, Utils} from '../../../utils'

import ValueRow from './valueRow'

export type StatusCategoryEmptyState = {
    icon: JSX.Element
    color: string
    text: {
        id: string
        defaultMessage: string
    }
}

export type EditablePropertyOption = IPropertyOption & {
    editing?: boolean
    focused?: boolean
}

export type StatusCategory = {
    id: string
    title: string
    options: EditablePropertyOption[]
    emptyState: StatusCategoryEmptyState
}

type Props = {
    valueCategories: StatusCategory[]
    onClose: () => void
    onUpdate: (updatedValueCategories: StatusCategory[]) => void
}

const EditStatusPropertyDialog = (props: Props): JSX.Element => {
    const [valueCategories, setValueCategories] = useState<StatusCategory[]>([])
    const [focusedValueID, setFocusedValueID] = useState<string>()
    const intl = useIntl()

    useEffect(() => {
        // we save a deel copy of props as user actions like
        // DND and adding, editing, changing coloror deleting the values
        // affect this local copy first and only if the user clicks the
        // "Save" button, are the changes propogated to the prop change callback function/
        // Direcxtly modifying the props value can cause the value of variable
        // from the parent component to be affected as well in some cases
        setValueCategories(cloneDeep(props.valueCategories))
    }, [props.valueCategories])

    const title = (
        <FormattedMessage
            id='statusProperty.configDialog.title'
            defaultMessage='Edit Statuses'
        />
    )

    const handleUpdateValue = (statusCategoryID: string, newOptionValue: IPropertyOption): void => {
        newOptionValue.value = newOptionValue.value.trim()

        const categoryIndex = valueCategories.findIndex((valueCategory) => valueCategory.id === statusCategoryID)
        if (categoryIndex < 0) {
            Utils.logError(`category with ID: ${statusCategoryID} not found`)
            return
        }

        const valueIndex = valueCategories[categoryIndex].options.findIndex((option) => option.id === newOptionValue.id)
        if (valueIndex < 0) {
            Utils.logError(`Value with ID ${newOptionValue.id} not found`)
            return
        }

        const updatedValueCategories = [...valueCategories]
        const oldOptionvalue = updatedValueCategories[categoryIndex].options[valueIndex]

        if (oldOptionvalue.value === newOptionValue.value && newOptionValue.value === '') {
            // if used add a new value, but then leaves it empty by, for example,
            // clicking outside, we delete that value as its the fasted way for the user
            // to remove an accidently added value
            updatedValueCategories[categoryIndex].options.splice(valueIndex, 1)
        } else {
            updatedValueCategories[categoryIndex].options[valueIndex] = newOptionValue
        }

        setFocusedValueID('')
        setValueCategories(updatedValueCategories)
    }

    const handleDeleteValue = (statusCategoryID: string, optionID: string) => {
        const categoryIndex = valueCategories.findIndex((valueCategory) => valueCategory.id === statusCategoryID)
        if (categoryIndex < 0) {
            Utils.logError(`category with ID: ${statusCategoryID} not found`)
            return
        }

        const valueIndex = valueCategories[categoryIndex].options.findIndex((option) => option.id === optionID)
        if (valueIndex < 0) {
            Utils.logError(`Value with ID ${optionID} not found`)
            return
        }

        const updatedValueCategories = Array.from(valueCategories)
        updatedValueCategories[categoryIndex].options.splice(valueIndex, 1)
        setValueCategories(updatedValueCategories)
    }

    const handleAddCategoryValue = (categoryID: string) => {
        const categoryIndex = valueCategories.findIndex((valueCategory) => valueCategory.id === categoryID)
        if (categoryIndex < 0) {
            return
        }

        const newOption: EditablePropertyOption = {
            id: Utils.createGuid(IDType.None),
            value: '',
            color: 'propColorOrange',
        }

        const updatedValueCategories = [...valueCategories]
        updatedValueCategories[categoryIndex].options.unshift(newOption)

        setFocusedValueID(newOption.id)
        setValueCategories(updatedValueCategories)
    }

    const onDragEndHandler = (result: DropResult) => {
        const {destination, source, type} = result

        if (type !== 'statusCategory' || !destination) {
            return
        }

        const updatedValues = Array.from(valueCategories)

        const sourceCategoryIndex = updatedValues.findIndex((valueCategory) => valueCategory.id === source.droppableId)
        const destinationCategoryIndex = updatedValues.findIndex((valueCategory) => valueCategory.id === destination.droppableId)
        const draggedObject = valueCategories[sourceCategoryIndex].options[source.index]

        updatedValues[sourceCategoryIndex].options.splice(source.index, 1)
        updatedValues[destinationCategoryIndex].options.splice(destination.index, 0, draggedObject)
        setValueCategories(updatedValues)
    }

    return (
        <ActionDialog
            onClose={props.onClose}
            title={title}
            className='StatusPropertyConfigrationDialog'
            onConfirm={() => {
                props.onUpdate(valueCategories)
                props.onClose()
            }}
            onCancel={props.onClose}
        >
            <div className='text-heading5'/>
            <div className='text-75'>
                <FormattedMessage
                    id='statusProperty.configDialog.subTitle'
                    defaultMessage='Categorise your status values to represent what each value represents'
                />
            </div>
            <div className='categorySwimlanes'>
                <DragDropContext onDragEnd={onDragEndHandler}>
                    {valueCategories.map((valueCategory) => {
                        return (
                            <div
                                key={valueCategory.id}
                                className='categorySwimlane'
                            >
                                <div className='categorySwimlane_Header'>
                                    <div className='text-heading1'>
                                        {valueCategory.title}
                                    </div>
                                    <Tooltip
                                        title={intl.formatMessage({
                                            id: valueCategory.emptyState.text.id,
                                            defaultMessage: valueCategory.emptyState.text.defaultMessage,
                                        })}
                                        placement='bottom'
                                        wrap={true}
                                    >
                                        <InfoIcon/>
                                    </Tooltip>
                                    <div
                                        className='addBtnWrapper'
                                        onClick={() => handleAddCategoryValue(valueCategory.id)}
                                    >
                                        <PlusIcon/>
                                    </div>
                                </div>
                                <Droppable
                                    type='statusCategory'
                                    droppableId={valueCategory.id}
                                >
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className='categorySwimlane_ValueArea'
                                        >
                                            <div className='overflowWrapper'>
                                                {
                                                    valueCategory.options.length === 0 &&
                                                    <div className='emptyColumnPlaceholder'>
                                                        <div
                                                            className='icon-wrapper'
                                                            style={{
                                                                backgroundColor: `rgba(var(${valueCategory.emptyState.color}), 0.2)`,
                                                                color: `rgba(var(${valueCategory.emptyState.color}), 1)`,
                                                            }}
                                                        >
                                                            {valueCategory.emptyState.icon}
                                                        </div>
                                                        <div className='placeholderText text-75'>
                                                            {
                                                                <FormattedMessage
                                                                    id={valueCategory.emptyState.text.id}
                                                                    defaultMessage={valueCategory.emptyState.text.defaultMessage}
                                                                />
                                                            }
                                                        </div>
                                                    </div>
                                                }
                                                {
                                                    valueCategory.options.length > 0 &&
                                                    valueCategory.options.map(
                                                        (option: EditablePropertyOption, index) =>
                                                            (
                                                                <ValueRow
                                                                    key={option.id}
                                                                    option={option}
                                                                    index={index}
                                                                    editing={option.id === focusedValueID}
                                                                    onUpdate={handleUpdateValue}
                                                                    onDelete={handleDeleteValue}
                                                                    valueCategoryID={valueCategory.id}
                                                                />
                                                            ),
                                                    )
                                                }
                                            </div>
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        )
                    })}
                </DragDropContext>
            </div>
        </ActionDialog>
    )
}

export default EditStatusPropertyDialog
