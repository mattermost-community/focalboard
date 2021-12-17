// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {ReactNode} from 'react'

import './boardSwitcherDialog.scss'
import {useIntl} from 'react-intl'

import octoClient from '../../octoClient'
import SearchDialog from '../searchDialog/searchDialog'
import Globe from '../../widgets/icons/globe'
import LockOutline from '../../widgets/icons/lockOutline'

type Props = {
    onClose: () => void
}

const BoardSwitcherDialog = (props: Props): JSX.Element => {
    const intl = useIntl()
    const title = intl.formatMessage({id: 'FindBoardsDialog.Title', defaultMessage: 'Find Boards'})
    const subTitle = intl.formatMessage(
        {
            id: 'FindBoardsDialog.SubTitle',
            defaultMessage: 'Type to find a board. Use <b>UP/DOWN</b> to browse. <b>ENTER</b> to select, <b>ESC</b> to dismiss',
        },
        {
            b: (...chunks) => <b>{chunks}</b>,
        },
    )

    // const [results, setResults] = useState<Block[]>([])

    const searchHandler = async (query: string): Promise<Array<ReactNode>> => {
        const blocks = await octoClient.getAllBlocks()
        const untitledBoardTitle = intl.formatMessage({id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled Board'})
        return blocks.map((block, i) => (
            <div
                key={block.id}
                className='blockSearchResult'
            >
                {/*TODO decide icon from board is public or private*/}
                {i % 2 === 0 ? <Globe/> : <LockOutline/>}
                <span>{block.title || untitledBoardTitle}</span>
            </div>
        ))
    }

    return (
        <SearchDialog
            onClose={props.onClose}
            title={title}
            subTitle={subTitle}
            searchHandler={searchHandler}
        />
    )
}

export default BoardSwitcherDialog
