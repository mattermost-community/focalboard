// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import './boardSwitcherDialog.scss'
import {useIntl} from 'react-intl'

import {Block} from '../../blocks/block'
import octoClient from '../../octoClient'
import SearchDialog from '../searchDialog/searchDialog'

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

    const [results, setResults] = useState<Block[]>([])

    const searchHandler = async (query: string): void => {
        setResults(await octoClient.getAllBlocks())
    }

    return (
        <SearchDialog
            onClose={props.onClose}
            title={title}
            subTitle={subTitle}
        />
    )
}
