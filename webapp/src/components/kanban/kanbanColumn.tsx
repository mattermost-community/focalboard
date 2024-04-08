// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, { useEffect } from 'react'; // Import useEffect
// import {useDrop} from 'react-dnd'
import { Droppable } from 'react-beautiful-dnd';

import {Card} from '../../blocks/card'
import './kanbanColumn.scss'

type Props = {
    // onDrop: (card: Card) => void
    children: React.ReactNode
    columnId: string; 
    setDraggedOverColumnId: (columnId: string | null) => void; 
}


const KanbanColumn: React.FC<Props> = ({ children, columnId, setDraggedOverColumnId }) => {
    // Correctly using useEffect hook here
    useEffect(() => {
        // Since you might want to clear the dragged over columnId when no longer dragging over,
        // You might need to return a cleanup function from useEffect or manage it differently.
    }, [columnId, setDraggedOverColumnId]); // Removed snapshot.isDraggingOver from dependencies

    return (
        <Droppable droppableId={columnId}>
            {(provided, snapshot) => {
                // This is where you would use snapshot.isDraggingOver
                // Moved the useEffect call outside of this callback function but you can act on snapshot.isDraggingOver here for other purposes.

                // Conditionally apply a class based on whether this Droppable is being dragged over
                const className = `octo-board-column ${snapshot.isDraggingOver ? 'dragover' : ''}`;
                
                // Effectively use the isDraggingOver state to communicate with the parent component
                useEffect(() => {
                    if (snapshot.isDraggingOver) {
                        setDraggedOverColumnId(columnId);
                    } else {
                        setDraggedOverColumnId(null); // Optionally reset when not dragging over
                    }
                }, [snapshot.isDraggingOver, columnId, setDraggedOverColumnId]);
                
                return (
                    <div ref={provided.innerRef} {...provided.droppableProps} className={className}>
                        <div className='octo-board-column-single'>
                            {children}
                            {provided.placeholder}
                        </div>
                    </div>
                );
            }}
        </Droppable>
    );
};
export default React.memo(KanbanColumn)
