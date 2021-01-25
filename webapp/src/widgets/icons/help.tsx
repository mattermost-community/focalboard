// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './help.scss'

export default function HelpIcon(): JSX.Element {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className='HelpIcon Icon'
            viewBox='0 0 35 35'
        >
            <g transform='translate(11, 26)'>
                <text style={{font: 'lighter 24px sans-serif'}}>{'?'}</text>
            </g>
            <circle
                cx='17'
                cy='17'
                r='15'
                stroke='black'
                fill='transparent'
                strokeWidth='1'
            />
        </svg>
    )
}
