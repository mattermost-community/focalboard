// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useIntl} from 'react-intl'

import {ContentBlock} from '../../blocks/contentBlock'
import {TextBlock} from '../../blocks/textBlock'
import mutator from '../../mutator'
import TextIcon from '../../widgets/icons/text'
import {MarkdownEditor} from '../markdownEditor'

import {contentRegistry} from './contentRegistry'

type Props = {
    block: ContentBlock
    readonly: boolean
}

const TextElement = React.memo((props: Props): JSX.Element => {
    const {block, readonly} = props
    const intl = useIntl()

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
})

contentRegistry.registerContentType({
    type: 'text',
    getDisplayText: (intl) => intl.formatMessage({id: 'ContentBlock.text', defaultMessage: 'text'}),
    getIcon: () => <TextIcon/>,
    createBlock: async () => {
        return new TextBlock()
    },
    createComponent: (block, readonly) => {
        return (
            <TextElement
                block={block}
                readonly={readonly}
            />
        )
    },
})

export default TextElement
