// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {useIntl} from 'react-intl'

import Dialog from '../dialog'
import Button from '../../widgets/buttons/button'

import './createCategory.scss'

type Props = {
    onClose: () => void
}

const CreateCategory = (props: Props): JSX.Element => {
    const intl = useIntl()

    const title = intl.formatMessage({id: 'SidebarCategories.CategoryMenu.CreateNew', defaultMessage: 'Create New Category'})
    const placeholder = intl.formatMessage({id: 'Categories.CreateCategoryDialog.Placeholder', defaultMessage: 'Name your category'})
    const cancelText = intl.formatMessage({id: 'Categories.CreateCategoryDialog.CancelText', defaultMessage: 'Cancel'})
    const createText = intl.formatMessage({id: 'Categories.CreateCategoryDialog.CreateText', defaultMessage: 'Create'})

    return (
        <Dialog
            className='CreateCategoryModal'
            onClose={props.onClose}
        >
            <div className='CreateCategory'>
                <h3>{title}</h3>
                <input
                    className='categoryNameInput'
                    type='text'
                    placeholder={placeholder}
                />
                <div className='actionButtons'>
                    <Button
                        title={cancelText}
                        size='medium'
                        submit={true}
                        onClick={props.onClose}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        title={createText}
                        size='medium'
                        submit={true}
                        emphasis={'danger'}
                        filled={true}
                        onClick={props.onClose}
                    >
                        {createText}
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default CreateCategory
