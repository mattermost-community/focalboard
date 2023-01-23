// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Block, createBlock} from './block'

type PageFields = {
    contentOrder: Array<string | string[]>
    properties: Record<string, any>
    icon: string
}

type Page = Block & {
    fields: PageFields
}

function createPage(block?: Block): Page {
    const contentOrder: Array<string|string[]> = []
    const contentIds = block?.fields?.contentOrder?.filter((id: any) => id !== null)

    if (contentIds?.length > 0) {
        for (const contentId of contentIds) {
            if (typeof contentId === 'string') {
                contentOrder.push(contentId)
            } else {
                contentOrder.push(contentId.slice())
            }
        }
    }

    return {
        ...createBlock(block),
        type: 'page',
        fields: {
            contentOrder,
            icon: block?.fields?.icon,
            properties: {...block?.fields?.properties},
        },
    }
}

function sortPagesAlphabetically(pages: Page[]): Page[] {
    // Strip leading emoji to prevent unintuitive results
    return pages.map((v) => {
        return {page: v, title: v.title.replace(/^\p{Emoji}*\s*/u, '')}
    }).sort((v1, v2) => v1.title.localeCompare(v2.title)).map((v) => v.page)
}

export {Page, sortPagesAlphabetically, createPage}
