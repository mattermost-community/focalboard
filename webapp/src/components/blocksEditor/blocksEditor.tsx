import React, {useState} from 'react';
import {useIntl, IntlShape} from 'react-intl';
import {ContentBlock as ContentBlockType} from '../../blocks/contentBlock'
import {Card} from '../../blocks/card';

import Editor from './editor';
import * as registry from './blocks';
import mutator from '../../mutator';
import {createBlock} from '../../blocks/block'

import './blocksEditor.scss'

type Props = {
    id?: string
    card: Card
    contents: Array<ContentBlockType|ContentBlockType[]>
    readonly: boolean
}

function showContent(intl: IntlShape, editing: ContentBlockType|null, setEditing: (block: ContentBlockType|null) => void, content: ContentBlockType|ContentBlockType[]): React.ReactNode {
    if (Array.isArray(content)) {
        return <>{content.map((c) => showContent(intl, editing, setEditing, c))}</>
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
        return (
            <div
                key={content.id}
                onClick={() => {
                    setEditing(content)
                }}
            >
                {contentType.render(content.title)}
            </div>
        )
    }
    return null
}

function BlocksEditor(props: Props) {
    const [editing, setEditing] = useState<ContentBlockType|null>(null)
    const intl = useIntl()

    return (
        <div className="BlocksEditor">
            {Object.values(props.contents).map((c) => showContent(intl, editing, setEditing, c))}
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
