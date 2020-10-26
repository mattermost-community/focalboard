// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './menuWrapper.scss'

type Props = {
    children?: React.ReactNode;
    onToggle?: (open: boolean) => void;
    isDisabled?: boolean;
    stopPropagationOnToggle?: boolean;
    className?: string
}

type State = {
    open: boolean;
}

export default class MenuWrapper extends React.PureComponent<Props, State> {
    private node: React.RefObject<HTMLDivElement>

    public constructor(props: Props) {
        super(props)
        if (!Array.isArray(props.children) || props.children.length !== 2) {
            throw new Error('MenuWrapper needs exactly 2 children')
        }
        this.state = {
            open: false,
        }
        this.node = React.createRef()
    }

    public componentDidMount() {
        document.addEventListener('click', this.closeOnBlur, true)
        document.addEventListener('keyup', this.keyboardClose, true)
    }

    public componentWillUnmount() {
        document.removeEventListener('click', this.closeOnBlur, true)
        document.removeEventListener('keyup', this.keyboardClose, true)
    }

    private keyboardClose = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.close()
        }

        if (e.key === 'Tab') {
            this.closeOnBlur(e)
        }
    }

    private closeOnBlur = (e: Event) => {
        if (this.node && this.node.current && e.target && this.node.current.contains(e.target as Node)) {
            return
        }

        this.close()
    }

    public close = () => {
        if (this.state.open) {
            this.setState({open: false})
        }
    }

    toggle = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        /**
         * This is only here so that we can toggle the menus in the sidebar, because the default behavior of the mobile
         * version (ie the one that uses a modal) needs propagation to close the modal after selecting something
         * We need to refactor this so that the modal is explicitly closed on toggle, but for now I am aiming to preserve the existing logic
         * so as to not break other things
        **/
        if (this.props.stopPropagationOnToggle) {
            e.preventDefault()
            e.stopPropagation()
        }
        const newState = !this.state.open
        this.setState({open: newState})
    }

    public render() {
        const {children} = this.props

        return (
            <div
                className={`MenuWrapper ${this.props.className || ''}`}
                onClick={this.toggle}
                ref={this.node}
            >
                {children ? Object.values(children)[0] : null}
                {children && this.state.open ? Object.values(children)[1] : null}
            </div>
        )
    }
}
