// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IContentBlock, MutableContentBlock} from '../../blocks/contentBlock'
import {MutableTextBlock} from '../../blocks/textBlock'
import mutator from '../../mutator'
import TextIcon from '../../widgets/icons/text'
import {MarkdownEditor} from '../markdownEditor'

import {contentRegistry} from './contentRegistry'

type Props = {
    block: IContentBlock
    readonly: boolean
    intl: IntlShape
}

class TextElement extends React.PureComponent<Props> {
    readonly type = 'text'

    createBlock(): MutableContentBlock {
        return new MutableTextBlock()
    }

    getDisplayText(intl: IntlShape): string {
        return intl.formatMessage({id: 'ContentBlock.text', defaultMessage: 'text'})
    }

    getIcon(): JSX.Element {
        return <TextIcon/>
    }

    render(): JSX.Element {
        const {intl, block, readonly} = this.props

        return (
            <MarkdownEditor
                text={block.title}
                placeholderText={intl.formatMessage({id: 'ContentBlock.editText', defaultMessage: 'Edit text...'})}
                onBlur={(text) => {
                    mutator.changeTitle(block, text, intl.formatMessage({id: 'ContentBlock.editCardText', defaultMessage: 'edit card text'}))
                }}
                readonly={readonly}
            />
        )
    }
}

contentRegistry.registerContentType({
    type: 'text',
    getDisplayText: (intl) => intl.formatMessage({id: 'ContentBlock.text', defaultMessage: 'text'}),
    getIcon: () => <TextIcon/>,
    createBlock: () => {
        return new MutableTextBlock()
    },
    addBlock: (card, contents, index, intl) => {
        const newBlock = new MutableTextBlock()
        newBlock.parentId = card.id
        newBlock.rootId = card.rootId

        const contentOrder = contents.map((o) => o.id)
        contentOrder.splice(index, 0, newBlock.id)
        const typeName = intl.formatMessage({id: 'ContentBlock.text', defaultMessage: 'text'})
        mutator.performAsUndoGroup(async () => {
            const description = intl.formatMessage({id: 'ContentBlock.addElement', defaultMessage: 'add {type}'}, {type: typeName})
            await mutator.insertBlock(newBlock, description)
            await mutator.changeCardContentOrder(card, contentOrder, description)
        })
    },
    createComponent: (block, intl, readonly) => {
        return (
            <TextElement
                block={block}
                intl={intl}
                readonly={readonly}
            />
        )
    },
})

export default injectIntl(TextElement)
