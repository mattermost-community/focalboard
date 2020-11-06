// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './horizontalGrip.scss'

type Props = {
    onDrag: (offset: number) => void
    onDragEnd: (offset: number) => void
}

type State = {
    isDragging?: boolean
    startX?: number
    offset?: number
}

class HorizontalGrip extends React.PureComponent<Props, State> {
    state: State = {
    }

    render(): JSX.Element {
        return (
            <div
                className='HorizontalGrip'
                onMouseDown={(e) => {
                    this.setState({isDragging: true, startX: e.clientX, offset: 0})
                    window.addEventListener('mousemove', this.globalMouseMove)
                    window.addEventListener('mouseup', this.globalMouseUp)
                }}
            />)
    }

    private globalMouseMove = (e: MouseEvent) => {
        if (!this.state.isDragging) {
            return
        }
        const offset = e.clientX - this.state.startX
        if (offset !== this.state.offset) {
            this.props.onDrag(offset)
            this.setState({offset})
        }
    }

    private globalMouseUp = (e: MouseEvent) => {
        window.removeEventListener('mousemove', this.globalMouseMove)
        window.removeEventListener('mouseup', this.globalMouseUp)
        this.setState({isDragging: false})
        const offset = e.clientX - this.state.startX
        this.props.onDragEnd(offset)
    }
}

export {HorizontalGrip}
