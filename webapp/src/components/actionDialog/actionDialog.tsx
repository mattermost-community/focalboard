// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useRef} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {useHotkeys} from 'react-hotkeys-hook'

import IconButton from '../../widgets/buttons/iconButton'
import CloseIcon from '../../widgets/icons/close'
import OptionsIcon from '../../widgets/icons/options'
import MenuWrapper from '../../widgets/menuWrapper'
import './actionDialog.scss'
import Button from '../../widgets/buttons/button'

import {Utils} from '../../utils'

type Props = {
    children: React.ReactNode
    size?: string
    toolsMenu?: React.ReactNode // some dialogs may not  require a toolmenu
    toolbar?: React.ReactNode
    hideCloseButton?: boolean
    className?: string
    title?: JSX.Element
    subtitle?: JSX.Element
    onClose: () => void
    confirmButtonText?: string
    onConfirm?: () => void
    cancelButtonText?: string
    onCancel?: () => void
    hideFooter?: boolean
}

const ActionDialog = (props: Props) => {
    const {toolsMenu, toolbar, title, subtitle, size} = props
    const intl = useIntl()

    const closeDialogText = intl.formatMessage({
        id: 'Dialog.closeDialog',
        defaultMessage: 'Close dialog',
    })

    useHotkeys('esc', () => props.onClose())

    const isBackdropClickedRef = useRef(false)

    return (
        <div className={`ActionDialog Dialog dialog-back ${props.className} size--${size || 'medium'}`}>
            <div className='backdrop'/>
            <div
                className='wrapper'
                onClick={(e) => {
                    e.stopPropagation()
                    if (!isBackdropClickedRef.current) {
                        return
                    }
                    isBackdropClickedRef.current = false
                    props.onClose()
                }}
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        isBackdropClickedRef.current = true
                    }
                }}
            >
                <div
                    role='dialog'
                    className={`dialog${props.hideFooter ? ' footerHidden' : ''}`}
                >
                    <div className='toolbar'>
                        <div>
                            {<h1 className='dialog-title'>{title || ''}</h1>}
                            {subtitle && <h5 className='dialog-subtitle'>{subtitle}</h5>}
                        </div>
                        <div className='toolbar--right'>
                            {toolbar && <div className='d-flex'>{toolbar}</div>}
                            {toolsMenu && <MenuWrapper>
                                <IconButton
                                    size='medium'
                                    icon={<OptionsIcon/>}
                                />
                                {toolsMenu}
                            </MenuWrapper>
                            }
                            {
                                !props.hideCloseButton &&
                                <IconButton
                                    className='dialog__close'
                                    onClick={props.onClose}
                                    icon={<CloseIcon/>}
                                    title={closeDialogText}
                                    size='medium'
                                />
                            }
                        </div>
                    </div>
                    {props.children}
                    {
                        !props.hideFooter &&
                        <div className='footer'>
                            <Button
                                onClick={props.onCancel}
                                emphasis='tertiary'
                                size='medium'
                            >
                                {
                                    props.cancelButtonText ||
                                    <FormattedMessage
                                        id='generic.cancel'
                                        defaultMessage='Cancel'
                                    />
                                }
                            </Button>
                            <Button
                                onClick={props.onConfirm}
                                emphasis='primary'
                                filled={true}
                                size='medium'
                            >
                                {
                                    props.confirmButtonText ||
                                    <FormattedMessage
                                        id='generic.save'
                                        defaultMessage='Save'
                                    />
                                }
                            </Button>
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default React.memo(ActionDialog)
