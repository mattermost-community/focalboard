import React from 'react';
import {useIntl} from 'react-intl';
import {ContentBlock as ContentBlockType} from '../../blocks/contentBlock'
import {useSortableWithGrip} from '../../hooks/sortable'
import IconButton from '../../widgets/buttons/iconButton'
import {Utils} from '../../utils'
import {Card} from '../../blocks/card'
import DeleteIcon from '../../widgets/icons/delete'
import OptionsIcon from '../../widgets/icons/options'
import SortDownIcon from '../../widgets/icons/sortDown'
import SortUpIcon from '../../widgets/icons/sortUp'
import GripIcon from '../../widgets/icons/grip'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import Editor from './editor';
import * as registry from './blocks';
import mutator from '../../mutator';

type Props = {
    editing: ContentBlockType|null
    setEditing: (block: ContentBlockType|null) => void
    content: ContentBlockType|ContentBlockType[]
    readonly?: boolean
    card: Card
    contentOrder: Array<string|string[]>
}

function BlocksEditorContentBlock(props: Props) {
    const {editing, setEditing, content, contentOrder, card} = props
    const intl = useIntl()
    // TODO: generate the valid cords
    const cords = {x: 0, y: 0}
    const [, , gripRef, itemRef] = useSortableWithGrip('content', {content, cords}, true, () => {})
    const [, isOver2,, itemRef2] = useSortableWithGrip('content', {content, cords}, true, (src, dst) => props.onDrop(src, dst, 'right'))
    const [, isOver3,, itemRef3] = useSortableWithGrip('content', {content, cords}, true, (src, dst) => props.onDrop(src, dst, 'left'))

    if (Array.isArray(content)) {
        return (
            <>
                {content.map((c) => (
                    <BlocksEditorContentBlock
                        editing={editing}
                        setEditing={setEditing}
                        card={card}
                        contentOrder={contentOrder}
                        content={c}
                    />
                ))}
            </>
        )
    }

    if (editing && editing.id === content.id) {
        return (
            <Editor
                onSave={(value, contentType) => {
                    if (contentType === 'text' && value === '') {
                        mutator.deleteBlock(editing, intl.formatMessage({id: 'ContentBlock.editCardText', defaultMessage: 'edit card text'}))
                    }
                    if (value !== editing.title) {
                        mutator.changeBlockTitle(editing.boardId, editing.id, editing.title, value, intl.formatMessage({id: 'ContentBlock.editCardText', defaultMessage: 'edit card text'}))
                    }
                    setEditing(null)
                }}
                initialValue={content.title}
                initialContentType={content.type}
            />
        )
    }
    const contentType = registry.get(content.type)
    if (contentType) {
        // TODO: Make index and colIndex real values
        const index = 0;
        const colIndex = 0;

        return (
            <div
                ref={itemRef}
                className={''}
            >
                <div className='octo-block-margin'>
                    {!props.readonly &&
                    <MenuWrapper>
                        <IconButton icon={<OptionsIcon/>}/>
                        <Menu>
                            {index > 0 &&
                                <Menu.Text
                                    id='moveUp'
                                    name={intl.formatMessage({id: 'ContentBlock.moveUp', defaultMessage: 'Move up'})}
                                    icon={<SortUpIcon/>}
                                    onClick={() => {
                                        Utils.arrayMove(contentOrder, index, index - 1)
                                        mutator.changeCardContentOrder(props.card.boardId, card.id, card.fields.contentOrder, contentOrder)
                                    }}
                                />}
                            {index < (contentOrder.length - 1) &&
                                <Menu.Text
                                    id='moveDown'
                                    name={intl.formatMessage({id: 'ContentBlock.moveDown', defaultMessage: 'Move down'})}
                                    icon={<SortDownIcon/>}
                                    onClick={() => {
                                        Utils.arrayMove(contentOrder, index, index + 1)
                                        mutator.changeCardContentOrder(props.card.boardId, card.id, card.fields.contentOrder, contentOrder)
                                    }}
                                />}
                            <Menu.Text
                                icon={<DeleteIcon/>}
                                id='delete'
                                name={intl.formatMessage({id: 'ContentBlock.Delete', defaultMessage: 'Delete'})}
                                onClick={() => {
                                    const description = intl.formatMessage({id: 'ContentBlock.DeleteAction', defaultMessage: 'delete'})

                                    if (colIndex > -1) {
                                        (contentOrder[index] as string[]).splice(colIndex, 1)
                                    } else {
                                        contentOrder.splice(index, 1)
                                    }

                                    // If only one item in the row, convert form an array item to normal item ( [item] => item )
                                    if (Array.isArray(contentOrder[index]) && contentOrder[index].length === 1) {
                                        contentOrder[index] = contentOrder[index][0]
                                    }

                                    mutator.performAsUndoGroup(async () => {
                                        await mutator.deleteBlock(content, description)
                                        await mutator.changeCardContentOrder(props.card.boardId, card.id, card.fields.contentOrder, contentOrder, description)
                                    })
                                }}
                            />
                        </Menu>
                    </MenuWrapper>
                    }
                    {!props.readonly &&
                        <div
                            ref={gripRef}
                            className='dnd-handle'
                        >
                            <GripIcon/>
                        </div>
                    }
                </div>
                <div
                    key={content.id}
                    onClick={() => {
                        setEditing(content)
                    }}
                >
                    {contentType.render(content.title)}
                </div>
            </div>
        )
    }
    return null
}

export default BlocksEditorContentBlock
