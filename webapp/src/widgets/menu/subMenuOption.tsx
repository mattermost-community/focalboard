// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import SubmenuTriangleIcon from '../icons/submenuTriangle'

import Menu from '.'

import './subMenuOption.scss'

type SubMenuOptionProps = {
    id: string,
    name: string,
    position?: 'bottom' | 'top'
    icon?: React.ReactNode
}

type SubMenuState = {
    isOpen: boolean;
}

export default class SubMenuOption extends React.PureComponent<SubMenuOptionProps, SubMenuState> {
    state = {
        isOpen: false,
    }

    private handleMouseEnter = (): void => {
        setTimeout(() => {
            this.setState({isOpen: true})
        }, 50)
    }

    private close = (): void => {
        this.setState({isOpen: false})
    }

    public render(): JSX.Element {
        return (
            <div
                className='MenuOption SubMenuOption menu-option'
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.close}
            >
                {this.props.icon ?? <div className='noicon'/>}
                <div className='menu-name'>{this.props.name}</div>
                <SubmenuTriangleIcon/>
                {this.state.isOpen &&
                    <div className={'SubMenu Menu noselect ' + (this.props.position || 'bottom')}>
                        <div className='menu-contents'>
                            <div className='menu-options'>
                                {this.props.children}
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
                }
            </div>
        )
    }

    private onCancel = () => {
        // No need to do anything, as click bubbled up to MenuWrapper, which closes
    }
}
