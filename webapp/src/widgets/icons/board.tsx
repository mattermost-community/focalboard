// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './board.scss'

export default function BoardIcon(): JSX.Element {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className='BoardIcon Icon'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
        >
            <g opacity='0.64'>
                <rect
                    x='3'
                    y='3'
                    width='18'
                    height='18'
                    rx='1'
                    stroke='white'
                    strokeWidth='2'
                />
                <rect
                    x='6'
                    y='6'
                    width='2'
                    height='6'
                    fill='white'
                />
                <rect
                    x='11'
                    y='6'
                    width='2'
                    height='10'
                    fill='white'
                />
                <rect
                    x='16'
                    y='6'
                    width='2'
                    height='3'
                    fill='white'
                />
            </g>
        </svg>
    )
}
