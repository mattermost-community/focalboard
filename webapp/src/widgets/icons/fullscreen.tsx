// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './fullscreen.scss'

export default function FullscreenIcon(): JSX.Element {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className='FullscreenIcon Icon'
            viewBox='0 0 100 100'
        >
            <polyline points='30,60 30,70 40,70'/>
            <polyline points='30,70 70,30'/>
            <polyline points='60,30 70,30 70,40'/>
        </svg>
    )
}
