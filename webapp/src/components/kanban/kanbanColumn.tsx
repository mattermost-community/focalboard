// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

type Props = {
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void
    isDropZone: boolean
    children: React.ReactNode
}

const KanbanColumn = React.memo((props: Props) => {
    const [isDragOver, setIsDragOver] = useState(false)

    let className = 'octo-board-column'
    if (props.isDropZone && isDragOver) {
        className += ' dragover'
    }
    return (
        <div
            className={className}
            onDragOver={(e) => {
                e.preventDefault()
                if (!isDragOver) {
                    setIsDragOver(true)
                }
            }}
            onDragEnter={(e) => {
                e.preventDefault()
                if (!isDragOver) {
                    setIsDragOver(true)
                }
            }}
            onDragLeave={(e) => {
                e.preventDefault()
                setIsDragOver(false)
            }}
            onDrop={(e) => {
                setIsDragOver(false)
                if (props.isDropZone) {
                    props.onDrop(e)
                }
            }}
        >
            {props.children}
        </div>
    )
})

export default KanbanColumn
