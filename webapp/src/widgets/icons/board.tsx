// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './board.scss'

export default function BoardIcon(): JSX.Element {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className='BoardIcon Icon'
            viewBox='0 0 100 100'
        >
            <rect
                x='10'
                y='10'
                width='80'
                height='80'
                rx='5'
                ry='5'
            />
            <polyline
                points='28,25 28,55'
                style={{strokeWidth: '15px'}}
            />
            <polyline
                points='50,25 50,70'
                style={{strokeWidth: '15px'}}
            />
            <polyline
                points='72,25 72,45'
                style={{strokeWidth: '15px'}}
            />
        </svg>
    )
}
