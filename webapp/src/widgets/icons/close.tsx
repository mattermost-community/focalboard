// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './close.scss'

export default function CloseIcon(): JSX.Element {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className='CloseIcon Icon'
            viewBox='0 0 100 100'
        >
            <polyline points='30,30 70,70'/>
            <polyline points='70,30 30,70'/>
        </svg>
    )
}
