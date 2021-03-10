// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable react/require-optimization */
import {IntlShape} from 'react-intl'

import {BlockTypes} from '../../blocks/block'
import {Card} from '../../blocks/card'
import {IContentBlock, MutableContentBlock} from '../../blocks/contentBlock'

type ContentHandler = {
    type: BlockTypes,
    getDisplayText: (intl: IntlShape) => string,
    getIcon: () => JSX.Element,
    createBlock: () => MutableContentBlock,
    addBlock(card: Card, contents: readonly IContentBlock[], index: number, intl: IntlShape): void,
    createComponent: (block: IContentBlock, intl: IntlShape, readonly: boolean) => JSX.Element,
}

class ContentRegistry {
    private registry: Map<BlockTypes, ContentHandler> = new Map()

    get contentTypes(): BlockTypes[] {
        return [...this.registry.keys()]
    }

    registerContentType(entry: ContentHandler) {
        this.registry.set(entry.type, entry)
    }

    isContentType(type: BlockTypes): boolean {
        return this.registry.has(type)
    }

    getHandler(type: BlockTypes): ContentHandler | undefined {
        return this.registry.get(type)
    }
}

const contentRegistry = new ContentRegistry()

// export type {ContentHandler}
export {contentRegistry}
