// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable react/require-optimization */
import React from 'react'

import {IntlShape} from 'react-intl'

import {BlockTypes} from '../../blocks/block'
import {IContentBlock, MutableContentBlock} from '../../blocks/contentBlock'
import {MutableDividerBlock} from '../../blocks/dividerBlock'
import {MutableImageBlock} from '../../blocks/imageBlock'
import {MutableTextBlock} from '../../blocks/textBlock'
import {Utils} from '../../utils'
import DividerIcon from '../../widgets/icons/divider'
import ImageIcon from '../../widgets/icons/image'
import TextIcon from '../../widgets/icons/text'

import DividerElement from './dividerElement'
import ImageElement from './imageElement'
import TextElement from './textElement'

type RegistryEntry = {
    type: BlockTypes,
    createBlock: () => MutableContentBlock,
    getDisplayText: (intl: IntlShape) => string,
    getIcon: () => JSX.Element,
    createComponent: (block: IContentBlock, readonly: boolean) => JSX.Element,
}

class ContentRegistry {
    private registry: Map<BlockTypes, RegistryEntry> = new Map()

    get contentTypes(): BlockTypes[] {
        return [...this.registry.keys()]
    }

    constructor() {
        this.registerContentType(
            {
                type: 'text',
                createBlock: () => {
                    return new MutableTextBlock()
                },
                getDisplayText: (intl) => intl.formatMessage({id: 'ContentBlock.text', defaultMessage: 'text'}),
                getIcon: () => <TextIcon/>,
                createComponent: (block, readonly) => (
                    <TextElement
                        block={block}
                        readonly={readonly}
                    />
                ),
            },
        )

        this.registerContentType(
            {
                type: 'image',
                createBlock: () => {
                    return new MutableImageBlock()
                },
                getDisplayText: (intl) => intl.formatMessage({id: 'ContentBlock.image', defaultMessage: 'image'}),
                getIcon: () => <ImageIcon/>,
                createComponent: (block) => <ImageElement block={block}/>,
            },
        )

        this.registerContentType(
            {
                type: 'divider',
                createBlock: () => {
                    return new MutableDividerBlock()
                },
                getDisplayText: (intl) => intl.formatMessage({id: 'ContentBlock.divider', defaultMessage: 'divider'}),
                getIcon: () => <DividerIcon/>,
                createComponent: () => <DividerElement/>,
            },
        )
    }

    private registerContentType(entry: RegistryEntry) {
        this.registry.set(entry.type, entry)
    }

    isContentType(type: BlockTypes): boolean {
        return this.registry.has(type)
    }

    createBlock(type: BlockTypes): MutableContentBlock | undefined {
        const entry = this.registry.get(type)
        return entry?.createBlock()
    }

    createComponent(block: IContentBlock, readonly: boolean): JSX.Element | undefined {
        const entry = this.registry.get(block.type)
        return entry?.createComponent(block, readonly)
    }

    typeDisplayText(intl: IntlShape, type: BlockTypes): string {
        const entry = this.registry.get(type)
        if (!entry) {
            Utils.logError(`Unknown type: ${type}`)
            return type
        }

        return entry.getDisplayText(intl)
    }

    getIcon(type: BlockTypes): JSX.Element | undefined {
        const entry = this.registry.get(type)
        return entry?.getIcon()
    }
}

const contentRegistry = new ContentRegistry()

export default contentRegistry
