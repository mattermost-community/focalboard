// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactNode} from 'react'

import Editable from '../../../widgets/editable'

import './link.scss'
import {Utils} from '../../../utils'
import LinkIcon from '../../../widgets/icons/Link'

type Props = {
    value: string
    onChange: (value: string) => void
    onSave: () => void
    onCancel: () => void
    validator: (newValue: string) => boolean
}

const URLProperty = (props: Props): JSX.Element => {
    let link: ReactNode = null
    if (props.value?.trim()) {
        link = (
            <a
                href={Utils.ensureProtocol(props.value.trim())}
                target='_blank'
                rel='noreferrer'
                onClick={(event) => event.stopPropagation()}
            >
                <LinkIcon/>
            </a>
        )
    }

    return (
        <div className='URLProperty property-link url'>
            <Editable
                className='octo-propertyvalue'
                placeholderText='Empty'
                value={props.value}
                onChange={props.onChange}
                onSave={props.onSave}
                onCancel={props.onCancel}
                validator={props.validator}
            />
            {link}
        </div>
    )
}

export default URLProperty
