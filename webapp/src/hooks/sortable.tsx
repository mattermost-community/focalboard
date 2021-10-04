// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useRef} from 'react'
import {useDrag, useDrop, DragElementWrapper, DragSourceOptions, DragPreviewOptions} from 'react-dnd'

import {IContentBlockWithCords} from '../blocks/contentBlock'
import {Block} from '../blocks/block'
import {IPropertyOption, IPropertyTemplate} from '../blocks/board'
import {Card} from '../blocks/card'

type SortableItem = Card | IPropertyOption | IPropertyTemplate
type HandlerItem = Card & IPropertyTemplate & IPropertyOption
type HandlerBaseItem = HandlerItem & IContentBlockWithCords
interface ISortableWithGripItem {
    block: Block | Block[],
    cords: {x: number, y?: number, z?: number}
}

function useSortableBase(itemType: string, item: SortableItem | ISortableWithGripItem, enabled: boolean, handler: (src: HandlerBaseItem, st: HandlerBaseItem) => void): [boolean, boolean, DragElementWrapper<DragSourceOptions>, DragElementWrapper<DragSourceOptions>, DragElementWrapper<DragPreviewOptions>] {
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
        drop: (dragItem: HandlerBaseItem) => {
            handler(dragItem, item as HandlerBaseItem)
        },
        canDrop: () => enabled,
    }), [item, handler, enabled])

    return [isDragging, isOver, drag, drop, preview]
}

export function useSortable(itemType: string, item: SortableItem, enabled: boolean, handler: (src: HandlerItem, st: HandlerItem) => void): [boolean, boolean, React.RefObject<HTMLDivElement>] {
    const ref = useRef<HTMLDivElement>(null)
    const [isDragging, isOver, drag, drop] = useSortableBase(itemType, item, enabled, handler)
    drop(drag(ref))
    return [isDragging, isOver, ref]
}

export function useSortableWithGrip(itemType: string, item: ISortableWithGripItem, enabled: boolean, handler: (src: IContentBlockWithCords, st: IContentBlockWithCords) => void): [boolean, boolean, React.RefObject<HTMLDivElement>, React.RefObject<HTMLDivElement>] {
    const ref = useRef<HTMLDivElement>(null)
    const previewRef = useRef<HTMLDivElement>(null)
    const [isDragging, isOver, drag, drop, preview] = useSortableBase(itemType, item, enabled, handler)
    drag(ref)
    drop(preview(previewRef))
    return [isDragging, isOver, ref, previewRef]
}
