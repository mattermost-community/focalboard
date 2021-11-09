// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './calendar.scss'

export default function CalendarIcon(): JSX.Element {
    return (
        <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            className='CalendarIcon Icon'
            xmlns='http://www.w3.org/2000/svg'
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
                    x='20'
                    y='7'
                    width='2'
                    height='16'
                    transform='rotate(90 20 7)'
                    fill='white'
                />
                <rect
                    x='6'
                    y='11'
                    width='2'
                    height='2'
                    fill='white'
                />
                <rect
                    x='8'
                    y='15'
                    width='2'
                    height='2'
                    transform='rotate(90 8 15)'
                    fill='white'
                />
                <rect
                    x='13'
                    y='11'
                    width='2'
                    height='2'
                    transform='rotate(90 13 11)'
                    fill='white'
                />
                <rect
                    x='13'
                    y='15'
                    width='2'
                    height='2'
                    transform='rotate(90 13 15)'
                    fill='white'
                />
                <rect
                    x='18'
                    y='11'
                    width='2'
                    height='2'
                    transform='rotate(90 18 11)'
                    fill='white'
                />
                <rect
                    x='18'
                    y='15'
                    width='2'
                    height='2'
                    transform='rotate(90 18 15)'
                    fill='white'
                />
            </g>
        </svg>
    )
}
