// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {getCurrentWorkspace} from '../store/workspace'
import {useAppSelector, useAppDispatch} from '../store/hooks'
import {Utils} from '../utils'
import {Board} from '../blocks/board'
import {getGlobalTemplates, fetchGlobalTemplates} from '../store/globalTemplates'
import {getSortedTemplates} from '../store/boards'
import AddIcon from '../widgets/icons/add'
import BoardIcon from '../widgets/icons/board'
import octoClient from '../octoClient'

import {addBoardTemplateClicked, addBoardClicked} from './sidebar/sidebarAddBoardMenu'
import {addBoardFromTemplate, BoardTemplateButtonMenu} from './sidebar/boardTemplateMenuItem'

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

const PanelButton = React.memo((props: ButtonProps) => {
    const {onClick, buttonIcon, title, readonly, showBoard, boardTemplate, classNames} = props

    return (
        <div
            onClick={onClick}
            className={`button ${classNames || ''}`}
        >
            <span>{buttonIcon}</span>
            <span className='button-title'>{title}</span>
            {!readonly && showBoard && boardTemplate &&
                <BoardTemplateButtonMenu
                    showBoard={showBoard}
                    boardTemplate={boardTemplate}
                />
            }
        </div>
    )
})

const EmptyCenterPanel = React.memo(() => {
    const workspace = useAppSelector(getCurrentWorkspace)
    const templates = useAppSelector(getSortedTemplates)
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

    const showBoard = useCallback((boardId) => {
        const params = {...match.params, boardId: boardId || ''}
        delete params.viewId
        const newPath = generatePath(match.path, params)
        history.push(newPath)
    }, [match, history])

    const newTemplateClicked = () => addBoardTemplateClicked(showBoard, intl)
    const emptyBoardClicked = () => addBoardClicked(showBoard, intl)

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
                <span className='choose-template-text'>
                    <FormattedMessage
                        id='EmptyCenterPanel.plugin.choose-a-template'
                        defaultMessage='Choose a template'
                    />
                </span>
                <div className='button-container'>
                    {templates.map((template) =>
                        (
                            <PanelButton
                                key={template.id}
                                title={template.title}
                                buttonIcon={template.fields.icon}
                                readonly={false}
                                onClick={() => addBoardFromTemplate(intl, showBoard, template.id)}
                                showBoard={showBoard}
                                boardTemplate={template}
                            />
                        ),
                    )}
                    {globalTemplates.map((template) =>
                        (
                            <PanelButton
                                key={template.id}
                                title={template.title}
                                buttonIcon={template.fields.icon}
                                readonly={true}
                                onClick={() => addBoardFromTemplate(intl, showBoard, template.id, undefined, true)}
                            />
                        ),
                    )}
                    <PanelButton
                        key={'new-template'}
                        title={intl.formatMessage({id: 'EmptyCenterPanel.plugin.new-template', defaultMessage: 'New template'})}
                        buttonIcon={<AddIcon/>}
                        readonly={true}
                        onClick={newTemplateClicked}
                        classNames='new-template'
                    />
                </div>
                <span className='choose-template-text'>
                    <FormattedMessage
                        id='EmptyCenterPanel.plugin.no-content-or'
                        defaultMessage='or'
                    />
                </span>
                <PanelButton
                    key={'start-with-an-empty-board'}
                    title={intl.formatMessage({id: 'EmptyCenterPanel.plugin.empty-board', defaultMessage: 'Start with an Empty Board'})}
                    buttonIcon={<BoardIcon/>}
                    readonly={true}
                    onClick={emptyBoardClicked}
                />
                <FormattedMessage
                    id='EmptyCenterPanel.plugin.end-message'
                    defaultMessage='You can change the channel using the switcher in the sidebar.'
                />
            </div>
        </div>

    )
})

export default EmptyCenterPanel
