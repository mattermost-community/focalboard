// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState, useCallback, useMemo} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {useHistory, useRouteMatch} from 'react-router-dom'
import Select from 'react-select'

import {Board} from '../../blocks/board'
import IconButton from '../../widgets/buttons/iconButton'
import CloseIcon from '../../widgets/icons/close'
import AddIcon from '../../widgets/icons/add'
import Button from '../../widgets/buttons/button'
import octoClient from '../../octoClient'
import mutator from '../../mutator'
import {getTemplates, getCurrentBoardId} from '../../store/boards'
import {getCurrentTeam, Team} from '../../store/teams'
import {fetchGlobalTemplates, getGlobalTemplates} from '../../store/globalTemplates'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'

import './boardTemplateSelector.scss'
import {OnboardingBoardTitle} from '../cardDetail/cardDetail'
import {IUser, UserConfigPatch} from '../../user'
import {VirtualLink} from '../../virtual'
import {getMe, patchProps} from '../../store/users'
import {BaseTourSteps, TOUR_BASE} from '../onboardingTour'
import {fetchPlaybooks, getPlaybooks, PlaybooksIdData} from '../../store/playbooks'

import {Utils} from '../../utils'

import {Constants} from '../../constants'

import BoardTemplateSelectorPreview from './boardTemplateSelectorPreview'
import BoardTemplateSelectorItem from './boardTemplateSelectorItem'

type Props = {
    title?: React.ReactNode
    description?: React.ReactNode
    onClose?: () => void
    channelId?: string
}

type SelectPlaybooksProps = {
    onUpdate: (ids: string[]) => void
    onDelete: (id: string) => void
    selectedPlaybooks: VirtualLink[]
    availableValues: VirtualLink[]
    handleUseTemplate: () => void
}

const isVirtualPlayblooks = (board: Board | undefined): boolean => {
    return board != null && board.virtualDriver === 'playbooks'
}

const SelectPlaybooks = ({onUpdate, selectedPlaybooks, availableValues, handleUseTemplate, onDelete}: SelectPlaybooksProps) => {
    return (
        <div
            style={{gap: '8px', alignItems: 'center'}}
            className='buttons'
        >
            <Select
                isMulti={true}
                options={availableValues}
                isSearchable={true}
                isClearable={true}
                placeholder={'Empty'}
                classNamePrefix={'react-select'}
                className='selectPlaybooks'
                getOptionLabel={(o: VirtualLink) => o.name}
                getOptionValue={(a: VirtualLink) => a.id}
                menuPlacement={'top'}
                closeMenuOnSelect={false}
                value={selectedPlaybooks}
                onChange={((item: any, action: any) => {
                    if (action.action === 'select-option') {
                        onUpdate(item.map((playbook: VirtualLink) => playbook.id))
                    } else if (action.action === 'clear') {
                        onUpdate([])
                    } else if (action.action === 'remove-value') {
                        onDelete(action.removedValue.id)
                    }
                })}
            />
            <Button
                filled={true}
                size={'medium'}
                onClick={handleUseTemplate}
                disabled={selectedPlaybooks.length === 0}
            >
                <FormattedMessage
                    id='BoardTemplateSelector.use-this-template'
                    defaultMessage='Use this template'
                />
            </Button>
        </div>
    )
}

const BoardTemplateSelector = (props: Props) => {
    const playbooksList = useAppSelector<PlaybooksIdData>(getPlaybooks) || {}
    const globalTemplates = useAppSelector<Board[]>(getGlobalTemplates) || []
    const currentBoardId = useAppSelector<string>(getCurrentBoardId) || null
    const currentTeam = useAppSelector<Team|null>(getCurrentTeam)
    const {title, description, onClose} = props
    const dispatch = useAppDispatch()
    const intl = useIntl()
    const history = useHistory()
    const match = useRouteMatch<{boardId: string, viewId?: string}>()
    const me = useAppSelector<IUser|null>(getMe)
    const [playbooksSelected, setPlaybooksSelected] = useState<string[]>([])

    const showBoard = useCallback(async (boardId) => {
        Utils.showBoard(boardId, match, history)
        if (onClose) {
            onClose()
        }
    }, [match, history, onClose])

    useEffect(() => {
        if (octoClient.teamId !== Constants.globalTeamId && globalTemplates.length === 0) {
            dispatch(fetchGlobalTemplates())
        }
        dispatch(fetchPlaybooks({teamId: octoClient.teamId}))
    }, [octoClient.teamId])

    const onBoardTemplateDelete = useCallback((template: Board) => {
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteBoardTemplate, {board: template.id})
        mutator.deleteBoard(
            template,
            intl.formatMessage({id: 'BoardTemplateSelector.delete-template', defaultMessage: 'Delete'}),
            async () => {},
            async () => {
                showBoard(template.id)
            },
        )
    }, [showBoard])

    const unsortedTemplates = useAppSelector(getTemplates)

    const templates = useMemo(() => Object.values(unsortedTemplates).sort((a: Board, b: Board) => a.createAt - b.createAt), [unsortedTemplates])
    const allTemplates = globalTemplates.concat(templates)

    const resetTour = async () => {
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.StartTour)

        if (!me) {
            return
        }

        const patch: UserConfigPatch = {
            updatedFields: {
                onboardingTourStarted: '1',
                onboardingTourStep: BaseTourSteps.OPEN_A_CARD.toString(),
                tourCategory: TOUR_BASE,
            },
        }

        const patchedProps = await octoClient.patchUserConfig(me.id, patch)
        if (patchedProps) {
            await dispatch(patchProps(patchedProps))
        }
    }

    const handleUseTemplate = async () => {
        if (activeTemplate.teamId === '0') {
            TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoardViaTemplate, {boardTemplateId: activeTemplate.properties.trackingTemplateId as string, channelID: props.channelId})
        }

        const boardsAndBlocks = await mutator.addBoardFromTemplate(currentTeam?.id || Constants.globalTeamId, intl, showBoard, () => showBoard(currentBoardId), activeTemplate.id, currentTeam?.id)

        const board = boardsAndBlocks.boards[0]

        if (isVirtualPlayblooks(board)) {
            await mutator.updateBoard({...board, channelId: props.channelId || '', virtualLink: playbooksSelected.join(',')}, board, 'linked channel')
        } else {
            await mutator.updateBoard({...board, channelId: props.channelId || ''}, board, 'linked channel')
        }
        if (activeTemplate.title === OnboardingBoardTitle) {
            resetTour()
        }
    }

    const handleDeletePlaybookSelected = (playbookId: string) => {
        setPlaybooksSelected((items: string[]) => items.filter((id: string) => id !== playbookId))
    }

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
                {onClose &&
                    <IconButton
                        size='medium'
                        onClick={onClose}
                        icon={<CloseIcon/>}
                        title={'Close'}
                    />}
            </div>
            <div className='header'>
                <h1 className='title'>
                    {title || (
                        <FormattedMessage
                            id='BoardTemplateSelector.title'
                            defaultMessage='Create a board'
                        />
                    )}
                </h1>
                <p className='description'>
                    {description || (
                        <FormattedMessage
                            id='BoardTemplateSelector.description'
                            defaultMessage='Add a board to the sidebar using any of the templates defined below or start from scratch.'
                        />
                    )}
                </p>
            </div>

            <div className='templates'>
                <div className='templates-list'>
                    {allTemplates.map((boardTemplate) => (
                        <BoardTemplateSelectorItem
                            key={boardTemplate.id}
                            isActive={activeTemplate?.id === boardTemplate.id}
                            template={boardTemplate}
                            onSelect={setActiveTemplate}
                            onDelete={onBoardTemplateDelete}
                            onEdit={showBoard}
                        />
                    ))}
                    <div
                        className='new-template'
                        onClick={() => mutator.addEmptyBoardTemplate(currentTeam?.id || '', intl, showBoard, () => showBoard(currentBoardId))}
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
                    {isVirtualPlayblooks(activeTemplate) &&
                        <SelectPlaybooks
                            onDelete={handleDeletePlaybookSelected}
                            onUpdate={setPlaybooksSelected}
                            handleUseTemplate={handleUseTemplate}
                            selectedPlaybooks={playbooksSelected.map((id: string) => playbooksList[id])}
                            availableValues={Object.values(playbooksList)}
                        />
                    }
                    {activeTemplate && activeTemplate.virtualDriver.length === 0 &&
                        <div className='buttons'>
                            <Button
                                filled={true}
                                size={'medium'}
                                onClick={handleUseTemplate}
                            >
                                <FormattedMessage
                                    id='BoardTemplateSelector.use-this-template'
                                    defaultMessage='Use this template'
                                />
                            </Button>
                            <Button
                                className='empty-board'
                                filled={false}
                                emphasis={'secondary'}
                                size={'medium'}
                                onClick={async () => {
                                    const boardsAndBlocks = await mutator.addEmptyBoard(currentTeam?.id || '', intl, showBoard, () => showBoard(currentBoardId))
                                    const board = boardsAndBlocks.boards[0]
                                    await mutator.updateBoard({...board, channelId: props.channelId || ''}, board, 'linked channel')
                                }}
                            >
                                <FormattedMessage
                                    id='BoardTemplateSelector.create-empty-board'
                                    defaultMessage='Create empty board'
                                />
                            </Button>
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default React.memo(BoardTemplateSelector)
