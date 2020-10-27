// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './add.scss'

export default function AddIcon(): JSX.Element {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className='AddIcon Icon'
            viewBox='0 0 100 100'
        >
            <polyline points='30,50 70,50'/>
            <polyline points='50,30 50,70'/>
        </svg>
    )
}
