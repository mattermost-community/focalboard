// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import MenuWrapper from '../widgets/menuWrapper'

import Button from './button'

import './dialog.scss'

type Props = {
    children: React.ReactNode
    toolsMenu: React.ReactNode
    onClose: () => void
}

export default class Dialog extends React.PureComponent<Props> {
    public componentDidMount(): void {
        document.addEventListener('keydown', this.keydownHandler)
    }

    public componentWillUnmount(): void {
        document.removeEventListener('keydown', this.keydownHandler)
    }

    private close(): void {
        this.props.onClose()
    }

    private keydownHandler = (e: KeyboardEvent): void => {
        if (e.target !== document.body) {
            return
        }

        if (e.keyCode === 27) {
            this.close()
            e.stopPropagation()
        }
    }

    public render(): JSX.Element {
        const {toolsMenu} = this.props

        return (
            <div
                className='Dialog dialog-back'
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        this.close()
                    }
                }}
            >
                <div className='dialog' >
                    {toolsMenu &&
                    <div className='toolbar'>
                        <div className='octo-spacer'/>
                        <MenuWrapper>
                            <Button>{'...'}</Button>
                            {toolsMenu}
                        </MenuWrapper>
                    </div>}
                    {this.props.children}
                </div>
            </div>
        )
    }
}
