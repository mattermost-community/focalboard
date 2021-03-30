// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './switch.scss'

type Props = {
    onChanged: (isOn: boolean) => void
    isOn: boolean
}

// Switch is an on-off style switch / checkbox
function Switch(props: Props): JSX.Element {
    const className = props.isOn ? 'Switch on' : 'Switch'
    return (
        <div
            className={className}
            onClick={() => {
                props.onChanged(!props.isOn)
            }}
        >
            <div className='octo-switch-inner'/>
        </div>
    )
}

export default React.memo(Switch)
