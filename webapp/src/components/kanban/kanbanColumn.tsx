// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, { useEffect } from 'react'; // Import useEffect
// import {useDrop} from 'react-dnd'
import { Droppable } from 'react-beautiful-dnd';

import {Card} from '../../blocks/card'
import './kanbanColumn.scss'

type Props = {
    children: React.ReactNode
    columnId: string; 
    setDraggedOverColumnId: (columnId: string | null) => void; 
    placeholderProps?: {
        clientHeight?: number;
        clientWidth?: number;
        clientY?: number;
        clientX?: number;
    };
    activeDragColumnId: string | null
}


const KanbanColumn: React.FC<Props> = ({ children, columnId, setDraggedOverColumnId, placeholderProps, activeDragColumnId }) => {
    return (
        <Droppable droppableId={columnId}>
            {(provided, snapshot) => {
                const isDraggingOver = snapshot.isDraggingOver;
                const className = `octo-board-column ${isDraggingOver ? 'dragover' : ''}`;
                useEffect(() => {
                    if (isDraggingOver) {
                        setDraggedOverColumnId(columnId);
                    } else {
                        setDraggedOverColumnId(null);
                    }
                }, [isDraggingOver, columnId, setDraggedOverColumnId]);
                
                return (
                    <div ref={provided.innerRef} {...provided.droppableProps} className={className}>
                        <div className='octo-board-column-single'>
                            {children}
                            {provided.placeholder}

                            {placeholderProps && columnId === activeDragColumnId && (
                                <div style={{
                                    position: "absolute",
                                    top: placeholderProps.clientY ?? 0,
                                    left: placeholderProps.clientX ?? 0,
                                    height: placeholderProps.clientHeight ?? 0,
                                    background: "#22272ca8",
                                    width: placeholderProps.clientWidth ?? 0,
                                    borderRadius: '8px'
                                }} />
                            )}
                        </div>
                    </div>
                );
            }}
        </Droppable>
    );
};
export default React.memo(KanbanColumn)
