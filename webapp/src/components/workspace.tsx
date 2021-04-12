// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {IWorkspace} from '../blocks/workspace'
import {Utils} from '../utils'
import {BoardTree} from '../viewModel/boardTree'
import {WorkspaceTree} from '../viewModel/workspaceTree'

import CenterPanel from './centerPanel'
import EmptyCenterPanel from './emptyCenterPanel'
import Sidebar from './sidebar/sidebar'
import './workspace.scss'

type Props = {
    workspace?: IWorkspace
    workspaceTree: WorkspaceTree
    boardTree?: BoardTree
    showBoard: (id?: string) => void
    showView: (id: string, boardId?: string) => void
    setSearchText: (text?: string) => void
    readonly: boolean
}

function centerContent(props: Props) {
    const {workspace, boardTree, setSearchText, showView} = props
    const {activeView} = boardTree || {}

    if (boardTree && activeView) {
        return (
            <CenterPanel
                boardTree={boardTree}
                setSearchText={setSearchText}
                showView={showView}
                readonly={props.readonly}
            />
        )
    }

    return (
        <EmptyCenterPanel workspace={workspace}/>
    )
}

const Workspace = React.memo((props: Props) => {
    const {workspace, boardTree, workspaceTree, showBoard, showView} = props

    Utils.assert(workspaceTree || !props.readonly)

    return (
        <div className='Workspace'>
            {!props.readonly &&
                <Sidebar
                    workspace={workspace}
                    showBoard={showBoard}
                    showView={showView}
                    workspaceTree={workspaceTree}
                    activeBoardId={boardTree?.board.id}
                />
            }
            <div className='mainFrame'>
                {(boardTree?.board.isTemplate) &&
                <div className='banner'>
                    <FormattedMessage
                        id='Workspace.editing-board-template'
                        defaultMessage="You're editing a board template"
                    />
                </div>}
                {centerContent(props)}
            </div>
        </div>
    )
})

export default Workspace
