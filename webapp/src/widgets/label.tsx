// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './label.scss'
import {OctoUtils} from '../octoUtils'

type Props = {
    color?: string
    title?: string
    children: React.ReactNode
    classNames?: string
}

// Switch is an on-off style switch / checkbox
function Label(props: Props): JSX.Element {
    console.log(props.color + ' ' + OctoUtils.getPropertyColor(props.color || ''))
    return (
        <span
            className={`Label ${props.color?.startsWith('propColorCustom') ? '' : props.color} ${props.classNames ? props.classNames : ''}`}
            title={props.title}
            style={props.color?.startsWith('propColorCustom') ? {backgroundColor: OctoUtils.getPropertyColor(props.color)} : {}}
        >
            {props.children}
        </span>
    )
}

export default React.memo(Label)
