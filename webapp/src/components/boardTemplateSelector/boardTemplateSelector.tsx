// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState, useCallback, useMemo} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {Board} from '../../blocks/board'
import IconButton from '../../widgets/buttons/iconButton'
import CloseIcon from '../../widgets/icons/close'
import AddIcon from '../../widgets/icons/add'
import DeleteIcon from '../../widgets/icons/delete'
import EditIcon from '../../widgets/icons/edit'
import Button from '../../widgets/buttons/button'
import octoClient from '../../octoClient'
import mutator from '../../mutator'
import {getTemplates, getCurrentBoard} from '../../store/boards'
import {fetchGlobalTemplates, getGlobalTemplates} from '../../store/globalTemplates'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import DeleteBoardDialog from '../sidebar/deleteBoardDialog'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'

import BoardTemplateSelectorPreview from './boardTemplateSelectorPreview'

import './boardTemplateSelector.scss'

type Props = {
    onClose: () => void
}

const BoardTemplateSelector = React.memo((props: Props) => {
    const globalTemplates = useAppSelector<Board[]>(getGlobalTemplates) || []
    const currentBoard = useAppSelector<Board>(getCurrentBoard) || null
    const {onClose} = props
    const dispatch = useAppDispatch()
    const intl = useIntl()
    const history = useHistory()
    const match = useRouteMatch<{boardId: string, viewId?: string}>()
    const [deleteBoardTemplateOpen, setDeleteBoardTemplateOpen] = useState<Board|null>(null)

    const showBoard = useCallback(async (boardId) => {
        const params = {...match.params, boardId: boardId || ''}
        delete params.viewId
        const newPath = generatePath(match.path, params)
        history.push(newPath)
        onClose()
    }, [match, history])

    useEffect(() => {
        if (octoClient.workspaceId !== '0' && globalTemplates.length === 0) {
            dispatch(fetchGlobalTemplates())
        }
    }, [octoClient.workspaceId])

    const unsortedTemplates = useAppSelector(getTemplates)
    const templates = useMemo(() => Object.values(unsortedTemplates).sort((a: Board, b: Board) => a.createAt - b.createAt), [unsortedTemplates])
    const allTemplates = globalTemplates.concat(templates)

    const [activeTemplate, setActiveTemplate] = useState<Board>(allTemplates[0])

    useEffect(() => {
        if (!activeTemplate) {
            setActiveTemplate(templates.concat(globalTemplates)[0])
        }
    }, [templates, globalTemplates])

    if (!allTemplates) {
        return <div/>
    }

    return (
        <div className='BoardTemplateSelector'>
            <div className='toolbar'>
                <IconButton
                    onClick={onClose}
                    icon={<CloseIcon/>}
                    title={'Close'}
                />
            </div>
            <div className='header'>
                <h1 className='title'>
                    <FormattedMessage
                        id='BoardTemplateSelector.title'
                        defaultMessage='Create a Board'
                    />
                </h1>
                <p className='description'>
                    <FormattedMessage
                        id='BoardTemplateSelector.description'
                        defaultMessage='Choose a template to help you get started. Easily customize the template to fit your needs, or create an empty board to start from scratch.'
                    />
                </p>
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

export default BoardTemplateSelector

