// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable react/require-optimization */
import {IntlShape} from 'react-intl'

import {BlockTypes} from '../../blocks/block'
import {IContentBlock, MutableContentBlock} from '../../blocks/contentBlock'

type ContentHandler = {
    type: BlockTypes,
    getDisplayText: (intl: IntlShape) => string,
    getIcon: () => JSX.Element,
    createBlock: () => MutableContentBlock,
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

    // createBlock(type: BlockTypes): MutableContentBlock | undefined {
    //     const entry = this.registry.get(type)
    //     return entry?.createBlock()
    // }

    // createComponent(block: IContentBlock, intl: IntlShape, readonly: boolean): JSX.Element | undefined {
    //     const entry = this.registry.get(block.type)
    //     return entry?.createComponent(block, intl, readonly)
    // }

    // typeDisplayText(intl: IntlShape, type: BlockTypes): string {
    //     const entry = this.registry.get(type)
    //     if (!entry) {
    //         Utils.logError(`Unknown type: ${type}`)
    //         return type
    //     }

    //     return entry.getDisplayText(intl)
    // }

    // getIcon(type: BlockTypes): JSX.Element | undefined {
    //     const entry = this.registry.get(type)
    //     return entry?.getIcon()
    // }
}

const contentRegistry = new ContentRegistry()

// export type {ContentHandler}
export {contentRegistry}
