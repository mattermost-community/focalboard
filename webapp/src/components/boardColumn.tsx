// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

type Props = {
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void
    isDropZone: boolean
}

type State = {
    isDragOver: boolean
}

class BoardColumn extends React.PureComponent<Props, State> {
    state = {
        isDragOver: false,
    }

    render(): JSX.Element {
        let className = 'octo-board-column'
        if (this.props.isDropZone && this.state.isDragOver) {
            className += ' dragover'
        }
        const element = (
            <div
                className={className}
                onDragOver={(e) => {
                    e.preventDefault()
                    if (!this.state.isDragOver) {
                        this.setState({isDragOver: true})
                    }
                }}
                onDragEnter={(e) => {
                    e.preventDefault()
                    if (!this.state.isDragOver) {
                        this.setState({isDragOver: true})
                    }
                }}
                onDragLeave={(e) => {
                    e.preventDefault()
                    this.setState({isDragOver: false})
                }}
                onDrop={(e) => {
                    this.setState({isDragOver: false})
                    if (this.props.isDropZone) {
                        this.props.onDrop(e)
                    }
                }}
            >
                {this.props.children}
            </div>)

        return element
    }
}

export {BoardColumn}
