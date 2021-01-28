// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import IconButton from '../widgets/buttons/iconButton'
import CloseIcon from '../widgets/icons/close'
import OptionsIcon from '../widgets/icons/options'
import MenuWrapper from '../widgets/menuWrapper'
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

    private keydownHandler = (e: KeyboardEvent): void => {
        if (e.target !== document.body) {
            return
        }

        if (e.keyCode === 27) {
            this.closeClicked()
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
                        this.closeClicked()
                    }
                }}
            >
                <div className='dialog' >
                    <div className='toolbar'>
                        {toolsMenu &&
                        <>
                            <IconButton
                                onClick={this.closeClicked}
                                icon={<CloseIcon/>}
                                title={'Close dialog'}
                                className='IconButton--large'
                            />
                            <div className='octo-spacer'/>
                            <MenuWrapper>
                                <IconButton
                                    className='IconButton--large'
                                    icon={<OptionsIcon/>}
                                />
                                {toolsMenu}
                            </MenuWrapper>
                        </>
                        }
                    </div>
                    {this.props.children}
                </div>
            </div>
        )
    }

    private closeClicked = () => {
        this.props.onClose()
    }
}
