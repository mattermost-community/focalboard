// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState, useContext} from 'react'

import SubmenuTriangleIcon from '../icons/submenuTriangle'

import Menu from '.'

import './subMenuOption.scss'

export const HoveringContext = React.createContext(false)

type SubMenuOptionProps = {
    id: string
    name: string
    position?: 'bottom' | 'top' | 'left' | 'left-bottom'
    icon?: React.ReactNode
    children: React.ReactNode
}

function SubMenuOption(props: SubMenuOptionProps): JSX.Element {
    const [isOpen, setIsOpen] = useState(false)
    const isHovering = useContext(HoveringContext)

    const openLeftClass = props.position === 'left' || props.position === 'left-bottom' ? ' open-left' : ''

    useEffect(() => {
        if (isHovering !== undefined) {
            setIsOpen(isHovering)
        }
    }, [isHovering])

    return (
        <div
            id={props.id}
            className={`MenuOption SubMenuOption menu-option${openLeftClass}${isOpen ? ' menu-option-active' : ''}`}
            onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen((open) => !open)
            }}
        >
            {(props.position === 'left' || props.position === 'left-bottom') && <SubmenuTriangleIcon/>}
            {props.icon ?? <div className='noicon'/>}
            <div className='menu-name'>{props.name}</div>
            {props.position !== 'left' && props.position !== 'left-bottom' && <SubmenuTriangleIcon/>}
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
