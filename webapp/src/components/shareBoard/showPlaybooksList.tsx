// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useEffect} from 'react'
import {useIntl} from 'react-intl'
import Select from 'react-select'

import {useAppDispatch, useAppSelector} from '../../store/hooks'
import Button from '../../widgets/buttons/button'
import octoClient from '../../octoClient'
import DeleteIcon from '../../widgets/icons/delete'
import CompassIcon from '../../widgets/icons/compassIcon'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import {Board} from '../../blocks/board'
import {VirtualLink} from '../../virtual'
import {fetchPlaybooks, getPlaybooks, PlaybooksIdData, StatusFetch, getPlaybooksFetchStatus} from '../../store/playbooks'
import Dialog from '../../components/dialog'
import {Utils} from '../../utils'

import './shareBoardButton.scss'

type ShowPlaybooksListProps = {
    numberOfPlaybooks: number
    board: Board
}

type SelectPlaybooksProps = {
    onUpdate: (ids: string[]) => void
    onDelete: (id: string) => void
    selectedPlaybooks: VirtualLink[]
    availableValues: VirtualLink[]
}

const SelectPlaybooks = ({onUpdate, selectedPlaybooks, availableValues, onDelete}: SelectPlaybooksProps) => {
    return (
        <div className='addLinkedPlaybooks'>
            <Select
                isMulti={true}
                options={availableValues}
                isSearchable={true}
                isClearable={true}
                placeholder={'Select a playbook'}
                classNamePrefix={'react-select'}
                getOptionLabel={(o: VirtualLink) => o.name}
                getOptionValue={(a: VirtualLink) => a.id}
                closeMenuOnSelect={false}
                value={selectedPlaybooks}
                onChange={((item: any, action: any) => {
                    if (action.action === 'select-option') {
                        onUpdate(item.map((playbook: VirtualLink) => playbook.id))
                    } else if (action.action === 'remove-value' && selectedPlaybooks.length > 1) {
                        onDelete(action.removedValue.id)
                    }
                })}
            />
        </div>
    )
}

const PlayBookConnectedItem = (props: {title: string, description: string, lastRunDate: string, disabledActions: boolean, onDelete: () => void}) => {
    return (<li className='playbookConnectedItem'>
        <div>
            <h4 style={{margin: 0}}>{props.title}</h4>
            <Button
                className='deletePlaybook'
                icon={<DeleteIcon/>}
                disabled={props.disabledActions}
                onClick={props.onDelete}
            />
        </div>
        <p>{props.description}</p>
        <p>{props.lastRunDate}</p>
    </li>)
}

const ShowPlaybooksList = (props: ShowPlaybooksListProps) => {
    const dispatch = useAppDispatch()
    const playbooksList = useAppSelector<PlaybooksIdData>(getPlaybooks) || {}
    const playbooksFetchStatus = useAppSelector<StatusFetch>(getPlaybooksFetchStatus)
    const [playbooksSelected, setPlaybooksSelected] = useState<string[]>(props.board.virtualLink.split(','))
    const [showShareDialog, setShowShareDialog] = useState(false)
    const intl = useIntl()

    const handleDelete = (playbookId: string) => {
        setPlaybooksSelected((items: string[]) => items.filter((id: string) => id !== playbookId))
    }

    useEffect(() => {
        if (playbooksFetchStatus === 'idle') {
            dispatch(fetchPlaybooks({teamId: octoClient.teamId}))
        }
    }, [])

    const Title = (
        <h3
            style={{
                margin: 0,
            }}
        >
            <CompassIcon
                icon='product-playbooks'
                className='playbookIcon'
            />
            {'Linked Playbooks'}
        </h3>)

    return (
        <>
            <div className='ShareBoardButton'>
                <Button
                    title='Share board'
                    size='medium'
                    active={showShareDialog}
                    emphasis={showShareDialog ? 'active' : 'default'}
                    icon={
                        <CompassIcon
                            icon='product-playbooks'
                            className='GlobeIcon deletePlaybook'
                        />}
                    onClick={() => {
                        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareBoardOpenModal, {board: props.board.id})
                        setShowShareDialog(!showShareDialog)
                        window.showPlaybooksConnected = true
                    }}
                >
                    {props.numberOfPlaybooks}
                </Button>
            </div>
            {showShareDialog &&
            <Dialog
                title={Title}
                onClose={() => setShowShareDialog(false)}
                toolsMenu={false}
                toolbar={false}
                className='playbookModal'
            >
                <SelectPlaybooks
                    onUpdate={setPlaybooksSelected}
                    onDelete={handleDelete}
                    selectedPlaybooks={playbooksSelected.map((id: string) => playbooksList[id])}
                    availableValues={Object.values(playbooksList)}
                />
                <div className='playbookBody'>
                    <ul className='playbookConnectedList'>
                        {playbooksSelected.map((playbookId) => {
                            return (
                                <PlayBookConnectedItem
                                    key={playbookId}
                                    title={playbooksList[playbookId].name}
                                    description={playbooksList[playbookId].type}
                                    lastRunDate={Utils.relativeDisplayDateTime(new Date(new Date().getTime() - 4000000), intl)}
                                    disabledActions={playbooksSelected.length === 1}
                                    onDelete={() => {
                                        handleDelete(playbookId)
                                    }}
                                />
                            )
                        })}
                    </ul>
                </div>
            </Dialog>
            }
        </>
    )
}

export default React.memo(ShowPlaybooksList)
