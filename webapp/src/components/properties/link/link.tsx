// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useRef, useState} from 'react'

import Editable, {Focusable} from '../../../widgets/editable'

import './link.scss'
import {Utils} from '../../../utils'
import EditIcon from '../../../widgets/icons/edit'
import IconButton from '../../../widgets/buttons/iconButton'

type Props = {
    value: string
    readonly?: boolean
    placeholder?: string
    onChange: (value: string) => void
    onSave: () => void
    onCancel: () => void
    validator: (newValue: string) => boolean
}

const URLProperty = (props: Props): JSX.Element => {
    const [isEditing, setIsEditing] = useState(false)
    const isEmpty = !props.value?.trim()
    const showEditable = !props.readonly && (isEditing || isEmpty)
    const editableRef = useRef<Focusable>(null)

    useEffect(() => {
        if (isEditing) {
            editableRef.current?.focus()
        }
    }, [isEditing])

    if (showEditable) {
        return (
            <div className='URLProperty'>
                <Editable
                    className='octo-propertyvalue'
                    ref={editableRef}
                    placeholderText={props.placeholder}
                    value={props.value}
                    autoExpand={true}
                    readonly={props.readonly}
                    onChange={props.onChange}
                    onSave={() => {
                        setIsEditing(false)
                        props.onSave()
                    }}
                    onCancel={() => {
                        setIsEditing(false)
                        props.onCancel()
                    }}
                    onFocus={() => setIsEditing(true)}
                    validator={props.validator}
                />
            </div>
        )
    }

    return (
        <div className='URLProperty octo-propertyvalue'>
            <a
                className='link'
                href={Utils.ensureProtocol(props.value.trim())}
                target='_blank'
                rel='noreferrer'
                onClick={(event) => event.stopPropagation()}
            >
                {props.value}
            </a>
            {!props.readonly &&
            <IconButton
                className='Button_Edit'
                icon={<EditIcon/>}
                onClick={() => setIsEditing(true)}
            />}
        </div>
    )
}

export default URLProperty
