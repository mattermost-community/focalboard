// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './options.scss'

export default function OptionsIcon(): JSX.Element {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className='OptionsIcon Icon'
            viewBox='0 0 100 100'
        >
            <circle
                cx='30'
                cy='50'
                r='5'
            />
            <circle
                cx='50'
                cy='50'
                r='5'
            />
            <circle
                cx='70'
                cy='50'
                r='5'
            />
        </svg>
    )
}
