// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactNode} from 'react'

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faExternalLinkAlt} from '@fortawesome/free-solid-svg-icons'

import Editable from '../../../widgets/editable'

import './link.scss'

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
                href={props.value.trim()}
                target={'_blank'}
                rel='noreferrer'
            >
                <FontAwesomeIcon icon={faExternalLinkAlt}/>
            </a>
        )
    }

    return (
        <div className={'property-link url'}>
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
