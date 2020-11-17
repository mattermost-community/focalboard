// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'

type Props = {
    children: React.ReactNode
}

export default class RootPortal extends React.PureComponent<Props> {
    el: HTMLDivElement

    static propTypes = {
        children: PropTypes.node,
    }

    constructor(props: Props) {
        super(props)
        this.el = document.createElement('div')
    }

    componentDidMount(): void {
        const rootPortal = document.getElementById('root-portal')
        if (rootPortal) {
            rootPortal.appendChild(this.el)
        }
    }

    componentWillUnmount(): void {
        const rootPortal = document.getElementById('root-portal')
        if (rootPortal) {
            rootPortal.removeChild(this.el)
        }
    }

    render(): JSX.Element {
        return ReactDOM.createPortal(
            this.props.children,
            this.el,
        )
    }
}
