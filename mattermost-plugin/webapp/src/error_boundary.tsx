// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react'
import PropTypes from 'prop-types'
import {useHistory} from 'react-router'

type State = {
    hasError: boolean
}

export default class ErrorBoundary extends React.Component {
    state = {hasError: false}
    propTypes = {children: PropTypes.node.isRequired}
    msg = 'Redirecting to error page...'

    handleError = useCallback(() => {
        useHistory().push('/error?id=unknown')
    }, [])

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
            this.handleError()
            return <span>{this.msg}</span>
        }
        return this.props.children
    }
}

