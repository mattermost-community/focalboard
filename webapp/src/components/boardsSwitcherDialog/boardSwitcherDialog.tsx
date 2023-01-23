// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {ReactNode, useRef, createRef, useState, useEffect, MutableRefObject, useContext} from 'react'

import './boardSwitcherDialog.scss'
import {useIntl} from 'react-intl'

import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import octoClient from '../../octoClient'
import isPagesContext from '../../isPages'
import SearchDialog from '../searchDialog/searchDialog'
import Globe from '../../widgets/icons/globe'
import LockOutline from '../../widgets/icons/lockOutline'
import {useAppSelector} from '../../store/hooks'
import {getAllTeams, getCurrentTeam, Team} from '../../store/teams'
import {getMe} from '../../store/users'
import {Utils} from '../../utils'
import {BoardTypeOpen, BoardTypePrivate} from '../../blocks/board'
import {Constants} from '../../constants'

type Props = {
    onClose: () => void
}

const BoardSwitcherDialog = (props: Props): JSX.Element => {
    const [selected, setSelected] = useState<number>(-1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [refs, setRefs] = useState<MutableRefObject<any>>(useRef([]))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [IDs, setIDs] = useState<any>({})
    const intl = useIntl()
    const team = useAppSelector(getCurrentTeam)
    const me = useAppSelector(getMe)
    const isPages = useContext(isPagesContext)

    const title = isPages ? intl.formatMessage({id: 'FindPagesDialog.Title', defaultMessage: 'Find Pages'}) : intl.formatMessage({id: 'FindBoardsDialog.Title', defaultMessage: 'Find Boards'})
    const subTitle = intl.formatMessage(
        isPages ? {
            id: 'FindPagesDialog.SubTitle',
            defaultMessage: 'Type to find a folder. Use <b>UP/DOWN</b> to browse. <b>ENTER</b> to select, <b>ESC</b> to dismiss',
        } : {
            id: 'FindBoardsDialog.SubTitle',
            defaultMessage: 'Type to find a board. Use <b>UP/DOWN</b> to browse. <b>ENTER</b> to select, <b>ESC</b> to dismiss',
        },
        {
            b: (...chunks) => <b>{chunks}</b>,
        },
    )

    const match = useRouteMatch<{boardId: string, viewId: string, cardId?: string}>()
    const history = useHistory()

    const selectBoard = async (teamId: string, boardId: string): Promise<void> => {
        if (!me) {
            return
        }
        const newPath = generatePath(Utils.getBoardPagePath(match.path), {...match.params, teamId, boardId, viewId: undefined})
        history.push(newPath)
        props.onClose()
    }

    const teamsById: Record<string, Team> = {}
    useAppSelector(getAllTeams).forEach((t) => {
        teamsById[t.id] = t
    })

    const searchHandler = async (query: string): Promise<ReactNode[]> => {
        if (query.trim().length === 0 || !team) {
            return []
        }

        const items = await octoClient.searchAll(query)
        const untitledBoardTitle = isPages ? intl.formatMessage({id: 'ViewTitle.untitled-folder', defaultMessage: 'Untitled page'}) : intl.formatMessage({id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled board'})
        refs.current = items.map((_, i) => refs.current[i] ?? createRef())
        setRefs(refs)
        return items.map((item, i) => {
            const resultTitle = item.title || untitledBoardTitle
            const teamTitle = teamsById[item.teamId].title
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setIDs((prevIDs: any) => ({
                ...prevIDs,
                [i]: [item.teamId, item.id],
            }))
            return (
                <div
                    key={item.id}
                    className='blockSearchResult'
                    onClick={() => selectBoard(item.teamId, item.id)}
                    ref={refs.current[i]}
                >
                    {item.type === BoardTypeOpen && <Globe/>}
                    {item.type === BoardTypePrivate && <LockOutline/>}
                    <span className='resultTitle'>{resultTitle}</span>
                    <span className='teamTitle'>{teamTitle}</span>
                </div>
            )
        })
    }

    const handleEnterKeyPress = (e: KeyboardEvent) => {
        if (Utils.isKeyPressed(e, Constants.keyCodes.ENTER) && selected > -1) {
            e.preventDefault()
            const [teamId, id] = IDs[selected]
            selectBoard(teamId, id)
        }
    }

    useEffect(() => {
        if (selected >= 0) {
            refs.current[selected].current.parentElement.focus()
        }

        document.addEventListener('keydown', handleEnterKeyPress)

        // cleanup function
        return () => {
            document.removeEventListener('keydown', handleEnterKeyPress)
        }
    }, [selected, refs, IDs])

    return (
        <SearchDialog
            onClose={props.onClose}
            title={title}
            subTitle={subTitle}
            searchHandler={searchHandler}
            selected={selected}
            setSelected={(n: number) => setSelected(n)}
        />
    )
}

export default BoardSwitcherDialog
