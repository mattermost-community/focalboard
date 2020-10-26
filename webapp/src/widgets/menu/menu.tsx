// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import SeparatorOption from './separatorOption'
import SwitchOption from './switchOption'
import TextOption from './textOption'
import ColorOption from './colorOption'
import SubMenuOption from './subMenuOption'

import './menu.scss'

type MenuProps = {
    children: React.ReactNode
    position?: 'top'|'bottom'
}

export default class Menu extends React.PureComponent<MenuProps> {
    static Color = ColorOption
    static SubMenu = SubMenuOption
    static Switch = SwitchOption
    static Separator = SeparatorOption
    static Text = TextOption

    public render(): JSX.Element {
        const {position, children} = this.props
        return (
            <div className={'Menu noselect ' + (position || 'bottom')}>
                <div className='menu-options'>
                    {children}
                </div>
            </div>
        )
    }
}
