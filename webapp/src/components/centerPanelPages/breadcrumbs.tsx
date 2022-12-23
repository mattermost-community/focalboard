// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useMemo} from 'react'
import {useIntl} from 'react-intl'

import {Page} from '../../blocks/page'
import {Board} from '../../blocks/board'

import './breadcrumbs.scss'

type Props = {
    board: Board
    pages: Page[]
    activePage: Page
    showPage: (pageId?: string) => void
}

const Breadcrumbs = (props: Props) => {
    const intl = useIntl()

    const pagesById = useMemo(() => {
        const result: {[key: string]: Page} = {}
        for (const page of props.pages) {
            result[page.id] = page
        }
        return result
    }, [props.pages])

    const breadcrumbs = useMemo(() => {
        const result = []
        if (props.activePage && props.activePage.id !== props.board.id) {
            let currentPage = props.activePage
            while (currentPage.parentId !== '') {
                result.unshift(currentPage)
                currentPage = pagesById[currentPage.parentId]
                if (!currentPage) {
                    break
                }
            }
        }
        return result
    }, [pagesById, props.activePage, props.board.id])

    return (
        <div className='Breadcrumbs'>
            <span
                className='page-breadcrumb'
                onClick={() => props.showPage('')}
            >
                {props.board.title ? props.board.title : intl.formatMessage({id: 'Breadcrumbs.untitled-page', defaultMessage: 'Untitled page'})}
            </span>
            {breadcrumbs.map((b) => (
                <React.Fragment key={b.id}>
                    <span>{' / '}</span>
                    <span
                        className='page-breadcrumb'
                        onClick={() => props.showPage(b.id)}
                    >
                        {b.title ? b.title : intl.formatMessage({id: 'Breadcrumbs.untitled-page', defaultMessage: 'Untitled page'})}
                    </span>
                </React.Fragment>
            ))}
        </div>
    )
}

export default React.memo(Breadcrumbs)
