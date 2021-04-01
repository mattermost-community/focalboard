// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React, {useRef, useState} from 'react'
import {IntlShape} from 'react-intl'

import {IPropertyOption} from '../../blocks/board'
import mutator from '../../mutator'
import {BoardTree, BoardTreeGroup} from '../../viewModel/boardTree'
import Button from '../../widgets/buttons/button'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import ShowIcon from '../../widgets/icons/show'
import Label from '../../widgets/label'

type Props = {
    boardTree: BoardTree
    group: BoardTreeGroup
    intl: IntlShape
    readonly: boolean
    onDropToColumn: (option: IPropertyOption) => void
    hasDraggedCards: boolean
}

export default function KanbanHiddenColumnItem(props: Props): JSX.Element {
    const {boardTree, intl, group} = props
    const {activeView} = boardTree

    const ref = useRef<HTMLDivElement>(null)
    const [dragClass, setDragClass] = useState('')

    return (
        <div
            ref={ref}
            key={group.option.id || 'empty'}
            className={`octo-board-hidden-item ${dragClass}`}
            onDragOver={(e) => {
                if (props.hasDraggedCards) {
                    setDragClass('dragover')
                    e.preventDefault()
                }
            }}
            onDragEnter={(e) => {
                if (props.hasDraggedCards) {
                    setDragClass('dragover')
                    e.preventDefault()
                }
            }}
            onDragLeave={(e) => {
                if (props.hasDraggedCards) {
                    setDragClass('')
                    e.preventDefault()
                }
            }}
            onDrop={(e) => {
                setDragClass('')
                e.preventDefault()
                if (props.hasDraggedCards) {
                    props.onDropToColumn(group.option)
                }
            }}
        >
            <MenuWrapper
                disabled={props.readonly}
            >
                <Label
                    key={group.option.id || 'empty'}
                    color={group.option.color}
                >
                    {group.option.value}
                </Label>
                <Menu>
                    <Menu.Text
                        id='show'
                        icon={<ShowIcon/>}
                        name={intl.formatMessage({id: 'BoardComponent.show', defaultMessage: 'Show'})}
                        onClick={() => mutator.unhideViewColumn(activeView, group.option.id)}
                    />
                </Menu>
            </MenuWrapper>
            <Button>{`${group.cards.length}`}</Button>
        </div>
    )
}

