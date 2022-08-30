import React, {useState} from 'react';
import {useIntl, IntlShape} from 'react-intl';
import {ContentBlock as ContentBlockType} from '../../blocks/contentBlock'
import {Card} from '../../blocks/card';

import Editor from './editor';
import * as registry from './blocks';
import mutator from '../../mutator';
import {createBlock} from '../../blocks/block'

import BlocksEditorContentBlock from './blocksEditorContentBlock'

import './blocksEditor.scss'

type Props = {
    id?: string
    card: Card
    contents: Array<ContentBlockType|ContentBlockType[]>
    readonly: boolean
}

function BlocksEditor(props: Props) {
    const [editing, setEditing] = useState<ContentBlockType|null>(null)
    const intl = useIntl()

    return (
        <div className="BlocksEditor">
            {Object.values(props.contents).map((c) => (
                <BlocksEditorContentBlock
                    editing={editing}
                    setEditing={setEditing}
                    content={c}
                    card={props.card}
                    contentOrder={props.card.fields.contentOrder}
                />
            ))}
            {!editing && (
                <Editor onSave={async (value, contentType) => {
                    const contentBlock = createBlock()
                    contentBlock.boardId = props.card.boardId
                    contentBlock.title = value
                    contentBlock.type = contentType
                    contentBlock.parentId = props.card.id
                    const newBlock = await mutator.insertBlock(contentBlock.boardId, contentBlock, intl.formatMessage({id: 'ContentBlock.addNewBlock', defaultMessage: 'add new content'}))
                    mutator.changeCardContentOrder(props.card.boardId, props.card.id, props.card.fields.contentOrder, [...props.card.fields.contentOrder, newBlock.id])
                }}/>)}
        </div>
    );
}

export default BlocksEditor;
