// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './table.scss'

export default function TableIcon(): JSX.Element {
    return (
        <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            className='TableIcon Icon'
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
                    x='8'
                    y='4'
                    width='2'
                    height='16'
                    fill='white'
                />
                <rect
                    x='20'
                    y='8'
                    width='2'
                    height='16'
                    transform='rotate(90 20 8)'
                    fill='white'
                />
                <rect
                    x='20'
                    y='8'
                    width='2'
                    height='16'
                    transform='rotate(90 20 8)'
                    fill='white'
                />
                <rect
                    x='20'
                    y='14'
                    width='2'
                    height='16'
                    transform='rotate(90 20 14)'
                    fill='white'
                />
            </g>
        </svg>
    )
}
