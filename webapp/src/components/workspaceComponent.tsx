// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {Utils} from '../utils'
import {BoardTree} from '../viewModel/boardTree'
import {WorkspaceTree} from '../viewModel/workspaceTree'

import BoardComponent from './boardComponent'
import Sidebar from './sidebar'
import TableComponent from './tableComponent'
import './workspaceComponent.scss'

type Props = {
    workspaceTree: WorkspaceTree
    boardTree?: BoardTree
    showBoard: (id?: string) => void
    showView: (id: string, boardId?: string) => void
    setSearchText: (text?: string) => void
    setLanguage: (lang: string) => void
    readonly: boolean
}

class WorkspaceComponent extends React.PureComponent<Props> {
    render(): JSX.Element {
        const {boardTree, workspaceTree, showBoard, showView, setLanguage} = this.props

        Utils.assert(workspaceTree)
        const element = (
            <div className='WorkspaceComponent'>
                {!this.props.readonly &&
                    <Sidebar
                        showBoard={showBoard}
                        showView={showView}
                        workspaceTree={workspaceTree}
                        activeBoardId={boardTree?.board.id}
                        setLanguage={setLanguage}
                    />
                }
                <div className='mainFrame'>
                    {(boardTree?.board.isTemplate) &&
                    <div className='banner'>
                        <FormattedMessage
                            id='WorkspaceComponent.editing-board-template'
                            defaultMessage="You're editing a board template"
                        />
                    </div>
                    }
                    {this.mainComponent()}
                </div>
            </div>)

        return element
    }

    private mainComponent() {
        const {boardTree, setSearchText, showView} = this.props
        const {activeView} = boardTree || {}

        if (!boardTree || !activeView) {
            return <div/>
        }

        switch (activeView.viewType) {
        case 'board': {
            return (
                <BoardComponent
                    boardTree={boardTree}
                    setSearchText={setSearchText}
                    showView={showView}
                    readonly={this.props.readonly}
                />)
        }

        case 'table': {
            return (
                <TableComponent
                    boardTree={boardTree}
                    setSearchText={setSearchText}
                    showView={showView}
                    readonly={this.props.readonly}
                />)
        }

        default: {
            Utils.assertFailure(`render() Unhandled viewType: ${activeView.viewType}`)
            return <div/>
        }
        }
    }
}

export {WorkspaceComponent}
