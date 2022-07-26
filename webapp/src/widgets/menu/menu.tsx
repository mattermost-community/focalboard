// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {CSSProperties} from 'react'

import SeparatorOption from './separatorOption'
import SwitchOption from './switchOption'
import TextOption from './textOption'
import ColorOption from './colorOption'
import SubMenuOption, {HoveringContext} from './subMenuOption'
import LabelOption from './labelOption'

import './menu.scss'
import textInputOption from './textInputOption'

type Props = {
    children: React.ReactNode
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
    fixed?: boolean
    parentRef?: React.RefObject<any>
}

const MENU_MARGIN = 40

export default class Menu extends React.PureComponent<Props> {
    static Color = ColorOption
    static SubMenu = SubMenuOption
    static Switch = SwitchOption
    static Separator = SeparatorOption
    static Text = TextOption
    static TextInput = textInputOption
    static Label = LabelOption

    menuRef: React.RefObject<HTMLDivElement>

    constructor(props: Props) {
        super(props)

        this.menuRef = React.createRef<HTMLDivElement>()
    }

    public state = {
        hovering: null,
        menuStyle: {},
    }

    public render(): JSX.Element {
        const {position, fixed, children} = this.props

        const style: CSSProperties = {}
        if (position === 'auto' && this.props.parentRef) {
            const boundingRect = this.props.parentRef.current?.getBoundingClientRect()
            const y = typeof boundingRect?.y === 'undefined' ? boundingRect?.top : boundingRect.y

            const windowHeight = window.innerHeight

            const totalSpace = windowHeight - MENU_MARGIN
            const spaceOnTop = y || 0
            const spaceOnBottom = totalSpace - spaceOnTop
            const openUp = spaceOnTop > spaceOnBottom

            if (openUp) {
                style.bottom = spaceOnBottom + MENU_MARGIN
            } else {
                style.top = spaceOnTop + 30
            }
        }

        return (
            <div
                className={`Menu noselect ${position || 'bottom'} ${fixed ? ' fixed' : ''}`}
                style={style}
                ref={this.menuRef}
            >
                <div className='menu-contents'>
                    <div className='menu-options'>
                        {React.Children.map(children, (child) => (
                            <div
                                onMouseEnter={() => this.setState({hovering: child})}
                            >
                                <HoveringContext.Provider value={child == this.state.hovering}>
                                    {child}
                                </HoveringContext.Provider>
                            </div>))}
                    </div>

                    <div className='menu-spacer hideOnWidescreen'/>

                    <div className='menu-options hideOnWidescreen'>
                        <Menu.Text
                            id='menu-cancel'
                            name={'Cancel'}
                            className='menu-cancel'
                            onClick={this.onCancel}
                        />
                    </div>
                </div>
            </div>
        )
    }

    private onCancel = () => {
        // No need to do anything, as click bubbled up to MenuWrapper, which closes
    }
}
