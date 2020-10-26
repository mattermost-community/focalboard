// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {MenuOptionProps} from './menuItem'

type SubMenuOptionProps = MenuOptionProps & {
    position?: 'bottom | top'
}

type SubMenuState = {
    isOpen: boolean;
}

export default class SubMenuOption extends React.PureComponent<SubMenuOptionProps, SubMenuState> {
    state = {
        isOpen: false,
    }

    private handleMouseEnter = (): void => {
        this.setState({isOpen: true})
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
                <div className='menu-name'>{this.props.name}</div>
                <div
                    className='imageSubmenuTriangle'
                    style={{float: 'right'}}
                />
                {this.state.isOpen &&
                    <div className={'SubMenu menu noselect ' + (this.props.position || 'bottom')}>
                        <div className='menu-options'>
                            {this.props.children}
                        </div>
                    </div>
                }
            </div>
        )
    }
}
