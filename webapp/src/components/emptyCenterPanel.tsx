// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect, useMemo} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {getCurrentWorkspace} from '../store/workspace'
import {useAppSelector, useAppDispatch} from '../store/hooks'
import {Utils} from '../utils'
import {Board} from '../blocks/board'
import mutator from '../mutator'
import {getGlobalTemplates, fetchGlobalTemplates} from '../store/globalTemplates'
import {getTemplates} from '../store/boards'
import AddIcon from '../widgets/icons/add'
import BoardIcon from '../widgets/icons/board'
import octoClient from '../octoClient'

import {BoardTemplateButtonMenu} from './sidebar/boardTemplateMenuItem'

import './emptyCenterPanel.scss'

type ButtonProps = {
    buttonIcon: string | React.ReactNode,
    title: string,
    readonly: boolean,
    onClick: () => void,
    showBoard?: (boardId: string) => void
    boardTemplate?: Board
    classNames?: string
}

const EmptyCenterPanel = React.memo(() => {
    const workspace = useAppSelector(getCurrentWorkspace)
    const unsortedTemplates = useAppSelector(getTemplates)
    const templates = useMemo(() => Object.values(unsortedTemplates).sort((a: Board, b: Board) => a.createAt - b.createAt), [unsortedTemplates])
    const allTemplates = globalTemplates.concat(templates)
    const globalTemplates = useAppSelector<Board[]>(getGlobalTemplates)
    const history = useHistory()
    const dispatch = useAppDispatch()
    const intl = useIntl()
    const match = useRouteMatch<{boardId: string, viewId?: string}>()

    useEffect(() => {
        if (octoClient.workspaceId !== '0' && globalTemplates.length === 0) {
            dispatch(fetchGlobalTemplates())
        }
    }, [octoClient.workspaceId])

    const showBoard = useCallback(async (boardId) => {
        const params = {...match.params, boardId: boardId || ''}
        delete params.viewId
        const newPath = generatePath(match.path, params)
        history.push(newPath)
    }, [match, history])

    if (!Utils.isFocalboardPlugin()) {
        return (
            <div className='EmptyCenterPanel'>
                <div className='Hint'>
                    <FormattedMessage
                        id='EmptyCenterPanel.no-content'
                        defaultMessage='Add or select a board from the sidebar to get started.'
                    />
                </div>
            </div>
        )
    }

    return (
        <div className='EmptyCenterPanel'>
            <div className='content'>
                <span className='title'>
                    <FormattedMessage
                        id='EmptyCenterPanel.plugin.no-content-title'
                        defaultMessage='Create a Board in {workspaceName}'
                        values={{workspaceName: workspace?.title}}
                    />
                </span>
                <span className='description'>
                    <FormattedMessage
                        id='EmptyCenterPanel.plugin.no-content-description'
                        defaultMessage='Add a board to the sidebar using any of the templates defined below or start from scratch.{lineBreak} Members of "{workspaceName}" will have access to boards created here.'
                        values={{
                            workspaceName: <b>{workspace?.title}</b>,
                            lineBreak: <br/>,
                        }}
                    />
                </span>
            </div>
            <div className='templates'>
                <div className='templates-list'>
                    {allTemplates.map((boardTemplate) => (
                        <div
                            key={boardTemplate.id}
                            className={activeTemplate?.id === boardTemplate.id ? 'template-item active' : 'template-item'}
                            onClick={() => setActiveTemplate(boardTemplate)}
                        >
                            <span className='template-icon'>{boardTemplate.fields.icon}</span>
                            <span className='template-name'>{boardTemplate.title}</span>
                            {boardTemplate.workspaceId !== '0' &&
                                <div className='actions'>
                                    <IconButton
                                        icon={<DeleteIcon/>}
                                        title={intl.formatMessage({id: 'BoardTemplateSelector.delete-template', defaultMessage: 'Delete'})}
                                        onClick={() => {
                                            setDeleteBoardTemplateOpen(boardTemplate)
                                        }}
                                    />
                                    <IconButton
                                        icon={<EditIcon/>}
                                        title={intl.formatMessage({id: 'BoardTemplateSelector.edit-template', defaultMessage: 'Edit'})}
                                        onClick={() => {
                                            showBoard(boardTemplate.id)
                                        }}
                                    />
                                </div>}
                        </div>
                    ))}
                    <div
                        className='new-template'
                        onClick={() => mutator.addEmptyBoardTemplate(intl, showBoard, () => showBoard(currentBoard.id))}
                    >
                        <span className='template-icon'><AddIcon/></span>
                        <span className='template-name'>
                            <FormattedMessage
                                id='BoardTemplateSelector.add-template'
                                defaultMessage='New template'
                            />
                        </span>
                    </div>
                </div>
                <div className='template-preview-box'>
                    <BoardTemplateSelectorPreview activeTemplate={activeTemplate}/>
                    <div className='buttons'>
                        <Button
                            filled={true}
                            onClick={() => mutator.addBoardFromTemplate(intl, showBoard, () => showBoard(currentBoard.id), activeTemplate.id, activeTemplate.workspaceId === '0')}
                        >
                            <FormattedMessage
                                id='BoardTemplateSelector.use-this-template'
                                defaultMessage='Use this template'
                            />
                        </Button>
                        <Button
                            filled={false}
                            className='empty-board'
                            onClick={() => mutator.addEmptyBoard(intl, showBoard, () => showBoard(currentBoard.id))}
                        >
                            <FormattedMessage
                                id='BoardTemplateSelector.create-empty-board'
                                defaultMessage='Create empty board'
                            />
                        </Button>
                    </div>
                </div>
            </div>
            {deleteBoardTemplateOpen &&
            <DeleteBoardDialog
                boardTitle={deleteBoardTemplateOpen.title}
                onClose={() => setDeleteBoardTemplateOpen(null)}
                isTemplate={true}
                onDelete={async () => {
                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteBoardTemplate, {board: deleteBoardTemplateOpen.id})
                    mutator.deleteBlock(
                        deleteBoardTemplateOpen,
                        intl.formatMessage({id: 'BoardTemplateSelector.delete-template', defaultMessage: 'Delete template'}),
                        async () => {
                        },
                        async () => {
                            showBoard(deleteBoardTemplateOpen.id)
                        },
                    )
                }}
            />}
        </div>

    )
})

export default EmptyCenterPanel
