// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {FormattedMessage} from 'react-intl'

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

    const generateValueRow = (option: IPropertyOption): JSX.Element => {
        return (
            <div
                key={option.id}
                className='categorySwimlane_Value'
            >
                <div className='dragHandleWrapper'>
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
                            <div className='categorySwimlane_ValueArea'>
                                <div className='overflowWrapper'>
                                    {
                                        valueCategory.options.length === 0 &&
                                        generateEmptyColumnPlaceholder(valueCategory.emptyState)
                                    }
                                    {
                                        valueCategory.options.length > 0 &&
                                        valueCategory.options.map((option) => generateValueRow(option))
                                    }
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </ActionDialog>
    )
}

export default EditStatusPropertyDialog
