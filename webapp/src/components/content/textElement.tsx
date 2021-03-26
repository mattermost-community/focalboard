// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IContentBlock} from '../../blocks/contentBlock'
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

const TextElement = React.memo((props: Props): JSX.Element => {
    const {intl, block, readonly} = props

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
        return new MutableTextBlock()
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
