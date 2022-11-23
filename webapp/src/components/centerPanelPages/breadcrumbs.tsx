import React from 'react'
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
    const breadcrumbs: Page[] = []
    if (props.activePage && props.activePage.id !== props.board.id) {
        const pagesById: {[key: string]: Page} = {}
        for (const page of props.pages) {
            pagesById[page.id] = page
        }
        let currentPage = props.activePage
        while (true) {
            breadcrumbs.unshift(currentPage)
            currentPage = pagesById[currentPage.parentId]
            if (!currentPage) {
                break
            }
        }
    }

    return (
        <div className='Breadcrumbs'>
            <span
                className='page-breadcrumb'
                onClick={() => props.showPage('')}
            >
                {props.board.title ? props.board.title : intl.formatMessage({id: 'Breadcrumbs.untitled-page', defaultMessage: 'Untitled page'})}
            </span>
            {breadcrumbs.map((b) => (
                <>
                    <span>{' / '}</span>
                    <span
                        className='page-breadcrumb'
                        onClick={() => props.showPage(b.id)}
                    >
                        {b.title ? b.title : intl.formatMessage({id: 'Breadcrumbs.untitled-page', defaultMessage: 'Untitled page'})}
                    </span>
                </>
            ))}
        </div>
    )
}

export default React.memo(Breadcrumbs)
