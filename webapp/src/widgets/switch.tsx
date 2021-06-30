// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './switch.scss'

type Props = {
    onChanged: (isOn: boolean) => void
    isOn: boolean
    readOnly?: boolean
    tooltip?: string
}

// Switch is an on-off style switch / checkbox
function Switch(props: Props): JSX.Element {
    const switchClassName = props.isOn ? 'Switch on' : 'Switch'
    const tooltipClassName = props.tooltip ? 'octo-tooltip tooltip-top' : ''
    const className = `${switchClassName} ${tooltipClassName}`.trim()
    return (
        <div
            className={className}
            data-tooltip={props.tooltip}
            onClick={() => {
                if (!props.readOnly) {
                    props.onChanged(!props.isOn)
                }
            }}
        >
            <div className='octo-switch-inner'/>
        </div>
    )
}

export default React.memo(Switch)
