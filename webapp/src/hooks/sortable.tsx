// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useRef} from 'react'
import {useDrag, useDrop, DragElementWrapper, DragPreviewOptions} from 'react-dnd'

export default function useSortable(itemType: string, item: any, enabled: boolean, handler: (src: any, st: any) => void): [boolean, boolean, React.RefObject<HTMLDivElement>, React.RefObject<HTMLDivElement>] {
    const ref = useRef<HTMLDivElement>(null)
    const previewRef = useRef<HTMLDivElement>(null)
    const [{isDragging}, drag, preview] = useDrag(() => ({
        type: itemType,
        item,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        canDrag: () => enabled,
    }), [itemType, item, enabled])
    const [{isOver}, drop] = useDrop(() => ({
        accept: itemType,
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
        drop: (dragItem: any) => {
            handler(dragItem, item)
        },
        canDrop: () => enabled,
    }), [item, handler, enabled])

    drop(drag(ref))
    drop(preview(previewRef))
    return [isDragging, isOver, ref, previewRef]
}
