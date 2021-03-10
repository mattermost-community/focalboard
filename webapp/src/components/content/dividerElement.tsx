// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {MutableDividerBlock} from '../../blocks/dividerBlock'
import mutator from '../../mutator'
import DividerIcon from '../../widgets/icons/divider'

import {contentRegistry} from './contentRegistry'
import './dividerElement.scss'

class DividerElement extends React.PureComponent {
    render(): JSX.Element {
        return <div className='DividerElement'/>
    }
}

contentRegistry.registerContentType({
    type: 'divider',
    getDisplayText: (intl) => intl.formatMessage({id: 'ContentBlock.divider', defaultMessage: 'divider'}),
    getIcon: () => <DividerIcon/>,
    createBlock: async () => {
        return new MutableDividerBlock()
    },
    addBlock: (card, contents, index, intl) => {
        const newBlock = new MutableDividerBlock()
        newBlock.parentId = card.id
        newBlock.rootId = card.rootId

        const contentOrder = contents.map((o) => o.id)
        contentOrder.splice(index, 0, newBlock.id)
        const typeName = intl.formatMessage({id: 'ContentBlock.divider', defaultMessage: 'divider'})
        mutator.performAsUndoGroup(async () => {
            const description = intl.formatMessage({id: 'ContentBlock.addElement', defaultMessage: 'add {type}'}, {type: typeName})
            await mutator.insertBlock(newBlock, description)
            await mutator.changeCardContentOrder(card, contentOrder, description)
        })
    },
    createComponent: () => <DividerElement/>,
})

export default DividerElement
