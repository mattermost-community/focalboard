// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

type Props = {
    tooltip: string
    children: any
    placement?: 'top'|'left'|'right'|'bottom'
}

// Adds tooltip div over children elements, the popup will
// be positioned based on the specified placement
// Default position is 'top'
function Tooltip(props: Props): JSX.Element {
    const placement = props.placement ? props.placement : 'top'
    const className = `octo-tooltip tooltip-${placement}`
    return (
        <div
            className={className}
            data-tooltip={props.tooltip}
        >{props.children}
        </div>
    )
}

export default React.memo(Tooltip)
