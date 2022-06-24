// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useRef} from 'react'
import {useIntl} from 'react-intl'
import {useHotkeys} from 'react-hotkeys-hook'

import './cardRHS.scss'
import IconButton from "../../widgets/buttons/iconButton"
import CloseIcon from "../../widgets/icons/close"
import MenuWrapper from "../../widgets/menuWrapper"
import OptionsIcon from "../../widgets/icons/options"
import {CardViewProps} from "../dialog"

const CardRHS = (props: CardViewProps): JSX.Element => {
    const {toolsMenu, toolbar, title} = props
    const intl = useIntl()

    const closeDialogText = intl.formatMessage({
        id: 'Dialog.closeDialog',
        defaultMessage: 'Close dialog',
    })

    useHotkeys('esc', () => props.onClose())

    const isBackdropClickedRef = useRef(false)

    return (
        <div className={`CardRHS ${props.className}`}>
            <div
                className='wrapper'
                onClick={(e) => {
                    e.stopPropagation()
                    if(!isBackdropClickedRef.current){
                        return
                    }
                    isBackdropClickedRef.current = false
                    props.onClose()

                }}
                onMouseDown={(e) => {
                    if(e.target === e.currentTarget){
                        isBackdropClickedRef.current = true
                    }
                }}
            >
                <div
                    role='dialog'
                    className='dialog'
                >
                    <div className='toolbar'>
                        {title && <h1 className='text-heading5 mt-2'>{title}</h1>}
                        {
                            toolsMenu &&
                            <MenuWrapper>
                                <IconButton
                                    size='medium'
                                    icon={<OptionsIcon/>}
                                />
                                {toolsMenu}
                            </MenuWrapper>
                        }
                        <div className='toolbar--right'>
                            {toolbar && <div>{toolbar}</div>}
                        </div>

                        {
                            !props.hideCloseButton &&
                            <IconButton
                                onClick={props.onClose}
                                icon={<CloseIcon/>}
                                title={closeDialogText}
                                size='medium'
                            />
                        }
                    </div>
                    {props.children}
                </div>
            </div>
        </div>
    )
}

export default React.memo(CardRHS)
