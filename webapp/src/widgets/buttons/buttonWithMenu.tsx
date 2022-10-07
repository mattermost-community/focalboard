// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import DropdownIcon from '../icons/dropdown'
import MenuWrapper from '../menuWrapper'

import './buttonWithMenu.scss'

type Props = {
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    children?: React.ReactNode
    title?: string
    text: React.ReactNode
    isPlaybooksReadOnly?: boolean
}

function ButtonWithMenu(props: Props): JSX.Element {
    const styleButton = {
        borderRadius: '5px',
        background: 'rgba(63, 67, 80, 0.08)',
        color: 'rgba(63, 67, 80, 0.4)',
    }

    const noClick = {
        pointerEvents: 'none',
    } as const

    return (
        <div
            onClick={props.onClick}
            className='ButtonWithMenu'
            title={props.title}
            style={props.isPlaybooksReadOnly ? noClick : {}}
        >
            <div
                style={props.isPlaybooksReadOnly ? styleButton : {}}
                className='button-text'
            >
                {props.text}
            </div>
            {!props.isPlaybooksReadOnly && <MenuWrapper stopPropagationOnToggle={true}>
                <div
                    className='button-dropdown'
                >
                    <DropdownIcon/>
                </div>
                {props.children}
            </MenuWrapper>}
        </div>
    )
}

export default React.memo(ButtonWithMenu)
