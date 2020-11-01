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
}

export default class ButtonWithMenu extends React.PureComponent<Props> {
    public render(): JSX.Element {
        return (
            <div
                onClick={this.props.onClick}
                className='ButtonWithMenu'
                title={this.props.title}
            >
                <div className='button-text'>
                    {this.props.text}
                </div>
                <MenuWrapper stopPropagationOnToggle={true}>
                    <div className='button-dropdown'>
                        <DropdownIcon/>
                    </div>
                    {this.props.children}
                </MenuWrapper>
            </div>
        )
    }
}
