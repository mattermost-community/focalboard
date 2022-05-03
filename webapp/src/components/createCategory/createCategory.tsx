// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, KeyboardEvent} from 'react'

import {useIntl} from 'react-intl'

import Dialog from '../dialog'
import Button from '../../widgets/buttons/button'

import './createCategory.scss'

type Props = {
    initialValue?: string
    onClose: () => void
    onCreate: (name: string) => void
    title: JSX.Element
}

const CreateCategory = (props: Props): JSX.Element => {
    const intl = useIntl()

    const placeholder = intl.formatMessage({id: 'Categories.CreateCategoryDialog.Placeholder', defaultMessage: 'Name your category' })
    const cancelText = intl.formatMessage({id: 'Categories.CreateCategoryDialog.CancelText', defaultMessage: 'Cancel' })
    const createText = intl.formatMessage({id: 'Categories.CreateCategoryDialog.CreateText', defaultMessage: 'Create' })
    const updateText = intl.formatMessage({id: 'Categories.CreateCategoryDialog.UpdateText', defaultMessage: 'Update' })

    const [name, setName] = useState(props.initialValue || '')

    const handleKeypress = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            props.onCreate(name)
        }
    }

    return (
        <Dialog
            className='CreateCategoryModal'
            onClose={props.onClose}
        >
            <div className='CreateCategory'>
                <h3>{props.title}</h3>
                <input
                    className='categoryNameInput'
                    type='text'
                    placeholder={placeholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus={true}
                    maxLength={100}
                    onKeyUp={handleKeypress}
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
                        {props.initialValue ? updateText : createText}
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default CreateCategory
