// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './table.scss'

export default function TableIcon(): JSX.Element {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className='TableIcon Icon'
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
            <polyline points='37,10 37,90'/>
            <polyline points='10,37 90,37'/>
            <polyline points='10,63 90,63'/>
        </svg>
    )
}
