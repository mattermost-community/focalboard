// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useRef, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {useHotkeys} from 'react-hotkeys-hook'

import './cardRHS.scss'
import {NumberSize, Resizable} from "re-resizable"

import {Direction} from "re-resizable/lib/resizer"

import {debounce} from "lodash"

import IconButton from "../../widgets/buttons/iconButton"
import CloseIcon from "../../widgets/icons/close"
import MenuWrapper from "../../widgets/menuWrapper"
import OptionsIcon from "../../widgets/icons/options"
import octoClient from "../../octoClient"
import {useAppDispatch, useAppSelector} from "../../store/hooks"
import {getMe, patchProps} from "../../store/users"
import {CardViewProps} from "../dialogCardView"
import PanelResizeHandle from "../../widgets/panelResizeHandle/panelResizeHandle"

const CardRHS = (props: CardViewProps): JSX.Element => {
    const {toolsMenu, toolbar} = props
    const intl = useIntl()
    const me = useAppSelector(getMe)
    const dispatch = useAppDispatch()

    const closeDialogText = intl.formatMessage({
        id: 'Dialog.closeDialog',
        defaultMessage: 'Close dialog',
    })

    useHotkeys('esc', () => props.onClose())

    const isBackdropClickedRef = useRef(false)

    const [width, setWidth] = useState<number>(420)

    useEffect(() => {
        if (me && me.props.rhsSize) {
            setWidth(parseFloat(me.props.rhsSize))
        }
    }, [me])

    const saveRHSSize = debounce(async (size: number) => {
        if (!me) {
            return
        }
        const patchedProps = await octoClient.patchUserConfig(me.id, {
            updatedFields: {
                rhsSize: size.toString(),
            }
        })

        if (patchedProps) {
            dispatch(patchProps(patchedProps))
        }
    }, 200)

    const rhsResizeHandler = (event: MouseEvent | TouchEvent, direction: Direction, elementRef: HTMLElement, delta: NumberSize) => {
        if (delta.width === 0) {
            // This happens when you try changing size to beyond min and max width.
            // This check avoid unnecessary user pref save API call.
            return
        }

        const newWidth = width + delta.width
        setWidth(newWidth)
        saveRHSSize(newWidth)
    }

    const handleComponent = React.useMemo(() => (<PanelResizeHandle/>), [])

    return (
        <Resizable
            className='CardRHSResizeWrapper'
            enable={{left: true}}
            maxWidth='100%'
            size={{width: width, height: '100%'}}
            onResizeStop={rhsResizeHandler}
            handleComponent={{
                left: handleComponent,
            }}
        >
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
                            <div className='rhsTitle'>
                                {
                                    <h2 className='text-heading3 mt-2 cardHeader'>
                                        <FormattedMessage
                                            id='rhs.title.card'
                                            defaultMessage='Card'
                                        />
                                    </h2>
                                }
                                {<h3 className='text-heading2 mt-2 boardTitle'>{props.board.title}</h3>}
                            </div>

                            <div className='toolbarContent'>
                                <div className='toolbar--right'>
                                    {toolbar && <div>{toolbar}</div>}
                                </div>

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
                        </div>
                        {props.children}
                    </div>
                </div>
            </div>
        </Resizable>
    )
}

export default React.memo(CardRHS)
