import React from 'react';
import {useDrag, useDrop} from 'react-dnd';

import Editor from './editor';
import * as registry from './blocks';
import {BlockData} from './blocks/types';
import GripIcon from '../../widgets/icons/grip';
import AddIcon from '../../widgets/icons/add';

import './blockContent.scss';

type Props = {
    block: BlockData
    editing: BlockData|null
    setEditing: (block: BlockData|null) =>  void
    setAfterBlock: (block: BlockData|null) =>  void
    onSave: (block: BlockData) => BlockData|null
    onMove: (block: BlockData, afterBlock: BlockData) =>  void
}

function BlockContent(props: Props) {
    const {block, editing, setEditing, onSave} = props
    const [{isDragging}, drag, preview] = useDrag(() => ({
        type: 'block',
        item: block,
        collect: monitor => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [block])
    const [{ isOver }, drop] = useDrop(
        () => ({
            accept: 'block',
            drop: (item: BlockData) => {
                if (item.id !== block.id) {
                    props.onMove(item, block)
                }
            },
            collect: (monitor) => ({
                isOver: !!monitor.isOver(),
            })
        }),
        [block, props.onMove]
    )

    if (editing && editing.id === block.id) {
        return (
            <Editor
                onSave={(block) => {
                    const updatedBlock = onSave(block)
                    props.setEditing(null)
                    props.setAfterBlock(updatedBlock)
                    return updatedBlock
                }}
                id={block.id}
                initialValue={block.value}
                initialContentType={block.contentType}
            />
        )
    }

    const contentType = registry.get(block.contentType)
    if (contentType && contentType.Display) {
        const DisplayContent = contentType.Display
        return (
            <div
                ref={drop}
                className={`BlockContent ${isOver ? 'over' : ''}`}
                key={block.id}
                style={{
                    opacity: isDragging ? 0.5 : 1,
                }}
                onClick={() => {
                    setEditing(block)
                }}
            >
                <span className='action'
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        props.setAfterBlock(block)
                    }}>
                    <AddIcon/>
                </span>
                <span
                    className='action'
                    ref={drag}
                >
                    <GripIcon/>
                </span>
                <div
                    className='content'
                    ref={preview}
                >
                    <DisplayContent
                        value={block.value}
                        onChange={() => null}
                        onCancel={() => null}
                        onSave={(value) => onSave({...block, value})}
                    />
                </div>
            </div>
        )
    }
    return null
}

export default BlockContent
