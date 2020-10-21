// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {BoardTree} from '../viewModel/boardTree'
import {Utils} from '../utils'
import {WorkspaceTree} from '../viewModel/workspaceTree'

import {BoardComponent} from './boardComponent'
import {Sidebar} from './sidebar'
import {TableComponent} from './tableComponent'

type Props = {
    workspaceTree: WorkspaceTree
    boardTree?: BoardTree
    showBoard: (id: string) => void
    showView: (id: string, boardId?: string) => void
    showFilter: (el: HTMLElement) => void
    setSearchText: (text: string) => void
}

class WorkspaceComponent extends React.Component<Props> {
    render() {
        const {boardTree, workspaceTree, showBoard, showView} = this.props

        Utils.assert(workspaceTree)
        const element =
            (<div className='octo-workspace'>
                <Sidebar
                    showBoard={showBoard}
                    showView={showView}
                    workspaceTree={workspaceTree}
                    boardTree={boardTree}
                />
                {this.mainComponent()}
            </div>)

        return element
    }

    private mainComponent() {
        const {boardTree, showFilter, setSearchText, showView} = this.props
        const {activeView} = boardTree || {}

        if (!activeView) {
            return <div/>
        }

        switch (activeView?.viewType) {
        case 'board': {
            return (<BoardComponent
                boardTree={boardTree}
                showFilter={showFilter}
                setSearchText={setSearchText}
                showView={showView}
                    />)
        }

        case 'table': {
            return (<TableComponent
                boardTree={boardTree}
                showFilter={showFilter}
                setSearchText={setSearchText}
                showView={showView}
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
