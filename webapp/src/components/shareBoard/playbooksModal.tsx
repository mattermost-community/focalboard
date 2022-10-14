// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import Select from 'react-select'

import {useAppDispatch, useAppSelector} from '../../store/hooks'
import Button from '../../widgets/buttons/button'
import octoClient from '../../octoClient'
import DeleteIcon from '../../widgets/icons/delete'
import CompassIcon from '../../widgets/icons/compassIcon'
import mutator from '../../mutator'
import {Board} from '../../blocks/board'
import {VirtualLink} from '../../virtual'
import {fetchPlaybooks, getPlaybooks, PlaybooksIdData, StatusFetch, getPlaybooksFetchStatus} from '../../store/playbooks'
import Dialog from '../../components/dialog'
import {Utils} from '../../utils'

import './shareBoardButton.scss'

type ShowPlaybooksListProps = {
    board: Board
    onClose: () => void
}

type SelectPlaybooksProps = {
    onUpdate: (ids: string[]) => void
    onDelete: (id: string) => void
    selectedPlaybooks: VirtualLink[]
    availableValues: VirtualLink[]
}

const SelectPlaybooks = ({onUpdate, selectedPlaybooks, availableValues, onDelete}: SelectPlaybooksProps) => {
    return (
        <div className='select-container'>
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

const PlaybooksModal = (props: ShowPlaybooksListProps) => {
    const dispatch = useAppDispatch()
    const playbooksList = useAppSelector<PlaybooksIdData>(getPlaybooks) || {}
    const playbooksFetchStatus = useAppSelector<StatusFetch>(getPlaybooksFetchStatus)
    const [playbooksSelected, setPlaybooksSelected] = useState<string[]>(props.board.virtualLink.split(','))
    const intl = useIntl()

    const handleDelete = (playbookId: string) => {
        setPlaybooksSelected((items: string[]) => items.filter((id: string) => id !== playbookId))
    }

    useEffect(() => {
        if (playbooksFetchStatus === 'idle') {
            dispatch(fetchPlaybooks({teamId: octoClient.teamId}))
        }
    }, [])

    useEffect(() => {
        const updateBoard = async () => {
            await mutator.updateBoard({...props.board, virtualLink: playbooksSelected.join(',')}, props.board, 'linked channel')
        }

        updateBoard()
    }, [playbooksSelected])

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
            <FormattedMessage
                id='playbooksModal.title'
                defaultMessage='Linked Playbooks'
            />
        </h3>)

    return (
        <Dialog
            title={Title}
            onClose={props.onClose}
            toolsMenu={false}
            toolbar={false}
            className='playbookModal'
        >
            <div className='addLinkedPlaybooks'>
                <SelectPlaybooks
                    onUpdate={setPlaybooksSelected}
                    onDelete={handleDelete}
                    selectedPlaybooks={playbooksSelected.map((id: string) => playbooksList[id])}
                    availableValues={Object.values(playbooksList)}
                />
            </div>
            <div className='playbookBody'>
                <ul className='playbookConnectedList'>
                    {playbooksSelected.map((playbookId) => {
                        return (
                            <PlayBookConnectedItem
                                key={playbookId}
                                title={playbooksList[playbookId].name}
                                description={playbooksList[playbookId].properties.Description}
                                lastRunDate={intl.formatMessage(
                                    {id: 'playbooksModal.lastRan', defaultMessage: 'Last ran {time}'},
                                    {time: Utils.relativeDisplayDateTime(playbooksList[playbookId].properties.LastRunAt, intl)},
                                )}
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
    )
}

export default React.memo(PlaybooksModal)
