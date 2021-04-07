// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useRef} from 'react'
import {useDrag, useDrop} from 'react-dnd'

export default function useSortable(itemType: string, item: any, handler: (src: any, st: any) => void): [boolean, boolean, React.RefObject<HTMLDivElement>] {
    const ref = useRef<HTMLDivElement>(null)
    const [{isDragging}, drag] = useDrag(() => ({
        type: itemType,
        item,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [itemType, item])
    const [{isOver}, drop] = useDrop(() => ({
        accept: itemType,
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
        drop: (dragItem: any) => {
            handler(dragItem, item)
        },
    }), [item, handler])

    drop(drag(ref))
    return [isDragging, isOver, ref]
}
