// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react'
import {FormattedMessage} from 'react-intl'

import {DragDropContext, Droppable, Draggable, DropReason, DropResult} from 'react-beautiful-dnd'

import PlusIcon from '../../../widgets/icons/plus'

import InfoIcon from '../../../widgets/icons/info'

import './editStatusDialog.scss'
import ActionDialog from '../../actionDialog/actionDialog'
import {IPropertyOption} from '../../../blocks/board'
import DragHandle from '../../../widgets/icons/dragHandle'
import EditIcon from '../../../widgets/icons/edit'

import {IDType, Utils} from '../../../utils'

import EditableLabel from './editableLabel/editableLabel'

export type StatusCategoryEmptyState = {
    icon: JSX.Element
    color: string
    text: JSX.Element
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

    useEffect(() => {
        setValueCategories(props.valueCategories)
    }, [props.valueCategories])

    const title = (
        <FormattedMessage
            id='statusProperty.configDialog.title'
            defaultMessage='Edit Statuses'
        />
    )

    const handleAddNewValue = (statusCategoryID: string, newOptionValue: IPropertyOption): void => {
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
        updatedValueCategories[categoryIndex].options[valueIndex] = newOptionValue

        setFocusedValueID('')
        setValueCategories(updatedValueCategories)
        props.onUpdate(updatedValueCategories)
    }

    const generateValueRow = (categoryID: string, option: EditablePropertyOption, index: number): JSX.Element => {
        return (
            <Draggable
                draggableId={option.id}
                index={index}
                key={index}
            >
                {(provided) => (
                    <div
                        {...provided.draggableProps}
                        ref={provided.innerRef}
                        key={option.id}
                        className='categorySwimlane_Value'
                    >
                        <div
                            {...provided.dragHandleProps}
                            className='dragHandleWrapper'
                        >
                            <DragHandle/>
                        </div>
                        <EditableLabel
                            option={option}
                            editing={option.id === focusedValueID}
                            focus={option.id === focusedValueID}
                            onBlur={(newOptionValue: IPropertyOption) => handleAddNewValue(categoryID, newOptionValue)}
                        />
                        <div className={`colorEditor ${option.color} withBorder`}/>
                        <EditIcon/>
                    </div>
                )}
            </Draggable>
        )
    }

    const generateEmptyColumnPlaceholder = (categoryEmptyState: StatusCategoryEmptyState): JSX.Element => {
        return (
            <div className='emptyColumnPlaceholder'>
                <div
                    className='icon-wrapper'
                    style={{
                        backgroundColor: `rgba(var(${categoryEmptyState.color}), 0.2)`,
                        color: `rgba(var(${categoryEmptyState.color}), 1)`,
                    }}
                >
                    {categoryEmptyState.icon}
                </div>
                <div className='placeholderText text-75'>
                    {categoryEmptyState.text}
                </div>
            </div>
        )
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

    const onDragEndHandler = useCallback(async (result: DropResult) => {
        const {destination, source, type} = result

        if (type !== 'statusCategory' || !destination) {
            return
        }

        console.log(`destination: ${destination} source: ${source} type: ${type}`)

        const updatedValues = Array.from(valueCategories)

        const sourceCategoryIndex = updatedValues.findIndex((valueCategory) => valueCategory.id === source.droppableId)
        const destinationCategoryIndex = updatedValues.findIndex((valueCategory) => valueCategory.id === destination.droppableId)

        const draggedObject = valueCategories[sourceCategoryIndex].options[source.index]

        updatedValues[sourceCategoryIndex].options.splice(source.index, 1)
        updatedValues[destinationCategoryIndex].options.splice(destination.index, 0, draggedObject)

        setValueCategories(updatedValues)
    }, [valueCategories])

    return (
        <ActionDialog
            onClose={props.onClose}
            title={title}
            className='StatusPropertyConfigrationDialog'
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
                                    <InfoIcon/>
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
                                         generateEmptyColumnPlaceholder(valueCategory.emptyState)
                                                }
                                                {
                                                    valueCategory.options.length > 0 &&
                                         valueCategory.options.map((option, index) => generateValueRow(valueCategory.id, option, index))
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
