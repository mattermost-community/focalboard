// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import SubmenuTriangleIcon from '../icons/submenuTriangle'

import Menu from '.'

import './subMenuOption.scss'

type SubMenuOptionProps = {
    id: string,
    name: string,
    position?: 'bottom' | 'top'
    icon?: React.ReactNode
    children: React.ReactNode
}

function SubMenuOption(props: SubMenuOptionProps): JSX.Element {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div
            id={props.id}
            className='MenuOption SubMenuOption menu-option'
            onMouseEnter={() => {
                setTimeout(() => {
                    setIsOpen(true)
                }, 50)
            }}
            onMouseLeave={() => setIsOpen(false)}
            onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(true)
            }}
        >
            {props.icon ?? <div className='noicon'/>}
            <div className='menu-name'>{props.name}</div>
            <SubmenuTriangleIcon/>
            {isOpen &&
                <div className={'SubMenu Menu noselect ' + (props.position || 'bottom')}>
                    <div className='menu-contents'>
                        <div className='menu-options'>
                            {props.children}
                        </div>
                        <div className='menu-spacer hideOnWidescreen'/>

                        <div className='menu-options hideOnWidescreen'>
                            <Menu.Text
                                id='menu-cancel'
                                name={'Cancel'}
                                className='menu-cancel'
                                onClick={() => undefined}
                            />
                        </div>
                    </div>

                </div>
            }
        </div>
    )
}

export default React.memo(SubMenuOption)
