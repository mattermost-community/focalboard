// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {FormattedMessage} from 'react-intl'

import {useCallback} from 'preact/hooks'

import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd'

import PlusIcon from '../../../widgets/icons/plus'

import InfoIcon from '../../../widgets/icons/info'

import './editStatusDialog.scss'
import ActionDialog from '../../actionDialog/actionDialog'
import Label from '../../../widgets/label'
import {IPropertyOption} from '../../../blocks/board'
import DragHandle from '../../../widgets/icons/dragHandle'

export type StatusCategoryEmptyState = {
    icon: JSX.Element
    color: string
    text: JSX.Element
}

export type StatusCategory = {
    id: string
    title: string
    options: IPropertyOption[]
    emptyState: StatusCategoryEmptyState
}

type Props = {
    valueCategories: StatusCategory[]
    onClose: () => void
}

const EditStatusPropertyDialog = (props: Props): JSX.Element => {
    const title = (
        <FormattedMessage
            id='statusProperty.configDialog.title'
            defaultMessage='Edit Statuses'
        />
    )

    const generateValueRow = (option: IPropertyOption, index: number): JSX.Element => {
        return (
            <Draggable
                draggableId={option.id}
                index={index}
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
                        <Label
                            key={option.id}
                            color={option.color}
                            title={option.value}
                        >
                            <span>{option.value}</span>
                        </Label>
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

    const onDragEndHandler = () => {}

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
                    {props.valueCategories.map((valueCategory) => {
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
                                    <PlusIcon/>
                                </div>
                                <Droppable droppableId={`categorySwimlane_${valueCategory.id}`}>
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
                                         valueCategory.options.map((option, index) => generateValueRow(option, index))
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
