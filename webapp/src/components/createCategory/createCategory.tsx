// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react'

import {FormattedMessage, useIntl} from 'react-intl'

import Dialog from '../dialog'
import Button from '../../widgets/buttons/button'

import './createCategory.scss'
import {Utils} from '../../utils'

type Props = {
    onClose: () => void
    onCreate: (name: string) => void
}

const CreateCategory = (props: Props): JSX.Element => {
    const intl = useIntl()

    const title = intl.formatMessage({id: 'SidebarCategories.CategoryMenu.CreateNew', defaultMessage: 'Create New Category'})
    const placeholder = intl.formatMessage({id: 'Categories.CreateCategoryDialog.Placeholder', defaultMessage: 'Name your category'})
    const cancelText = intl.formatMessage({id: 'Categories.CreateCategoryDialog.CancelText', defaultMessage: 'Cancel'})
    const createText = intl.formatMessage({id: 'Categories.CreateCategoryDialog.CreateText', defaultMessage: 'Create'})

    const [name, setName] = useState('')

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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus={true}
                    maxLength={100}
                />
                <div className='createCategoryActions'>
                    <Button
                        size={'medium'}
                        danger={true}
                        onClick={props.onClose}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        size={'medium'}
                        filled={Boolean(name)}
                        onClick={() => props.onCreate(name)}
                        disabled={!name}
                    >
                        {createText}
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default CreateCategory
