// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {CSSProperties, useCallback, useEffect, useRef, useState} from 'react'

import SeparatorOption from './separatorOption'
import SwitchOption from './switchOption'
import TextOption from './textOption'
import ColorOption from './colorOption'
import SubMenuOption, {HoveringContext} from './subMenuOption'
import LabelOption from './labelOption'

import './menu.scss'
import textInputOption from './textInputOption'
import MenuUtil from './menuUtil'

type Props = {
    children: React.ReactNode
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
    fixed?: boolean
    parentRef?: React.RefObject<any>
    menuMargin?: number
}

const MenuColor = ColorOption
const MenuSubMenu = SubMenuOption
const MenuSwitch = SwitchOption
const MenuSeparator = SeparatorOption
const MenuText = TextOption
const MenuTextInput = textInputOption
const MenuLabel = LabelOption

const Menu = (props: Props): JSX.Element => {
    const menuRef = useRef<HTMLDivElement>(null)
    const [hovering, setHovering] = useState<React.ReactNode>(null)
    const [menuStyle, setMenuStyle] = useState<CSSProperties>({})

    const {position, menuMargin, fixed, children} = props

    useEffect(() => {
        let style: CSSProperties = {}
        if (props.parentRef) {
            const forceBottom = position ? ['bottom', 'left', 'right'].includes(position) : false
            style = MenuUtil.openUp(props.parentRef, forceBottom, menuMargin).style
        }
        setMenuStyle(style)
    }, [props.parentRef, props.position, props.menuMargin])

    const onCancel = useCallback(() => {
        // No need to do anything, as click bubbled up to MenuWrapper, which closes
    }, [])

    return (
        <div
            className={`Menu noselect ${position || 'bottom'} ${fixed ? ' fixed' : ''}`}
            style={menuStyle}
            ref={menuRef}
        >
            <div className='menu-contents'>
                <div className='menu-options'>
                    {React.Children.map(children, (child) => (
                        <div
                            onMouseEnter={() => setHovering(child)}
                        >
                            <HoveringContext.Provider value={child === hovering}>
                                {child}
                            </HoveringContext.Provider>
                        </div>))}
                </div>

                <div className='menu-spacer hideOnWidescreen'/>

                <div className='menu-options hideOnWidescreen'>
                    <MenuText
                        id='menu-cancel'
                        name={'Cancel'}
                        className='menu-cancel'
                        onClick={onCancel}
                    />
                </div>
            </div>
        </div>
    )
}

export default Menu
export {
    MenuColor,
    MenuSubMenu,
    MenuSwitch,
    MenuSeparator,
    MenuText,
    MenuTextInput,
    MenuLabel,
}
