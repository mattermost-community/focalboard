// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {useHistory} from 'react-router'
import PropTypes from 'prop-types'

type State = {
    hasError: boolean
}

export default class ErrorBoundary extends React.Component {
    state = {hasError: false}
    history = useHistory()
    propTypes = {children: PropTypes.node.isRequired}
    msg = 'Redirecting to error page...'

    static getDerivedStateFromError(/*error: Error*/): State {
        return {hasError: true}
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        /* eslint-disable no-console */
        console.log(error, errorInfo)
        /* eslint-enable no-console */
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            this.history.push('/error?id=unknown')
            return <span>{this.msg}</span>
        }
        return this.props.children
    }
}

