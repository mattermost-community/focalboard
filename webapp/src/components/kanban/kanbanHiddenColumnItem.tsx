// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React from 'react'
import {IntlShape} from 'react-intl'
import {useDrop} from 'react-dnd'

import mutator from '../../mutator'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import ShowIcon from '../../widgets/icons/show'
import Label from '../../widgets/label'
import {Card} from '../../blocks/card'
import {BoardGroup} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'

import Button from '../../widgets/buttons/button'

type Props = {
    activeView: BoardView
    group: BoardGroup
    intl: IntlShape
    readonly: boolean
    onDrop: (card: Card) => void
}

export default function KanbanHiddenColumnItem(props: Props): JSX.Element {
    const {activeView, intl, group} = props
    const hiddenCardGroupId = 'hidden-card-group-id'

    const [{isOver}, drop] = useDrop(() => ({
        accept: 'card',
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
        drop: (item: Card) => {
            props.onDrop(item)
        },
    }), [props.onDrop])

    let className = 'octo-board-hidden-item'
    if (isOver) {
        className += ' dragover'
    }

    return (
        <div
            ref={drop}
            key={group.option.id || 'empty'}
            className={className}
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
                        onClick={() => mutator.unhideViewColumn(activeView.boardId, activeView, group.option.id)}
                    />
                </Menu>
            </MenuWrapper>
            {props.group.option.id !== hiddenCardGroupId && <Button>{`${group.cards.length}`}</Button>}
            {props.group.option.id === hiddenCardGroupId && <Button title='hidden-card-count'>{`${group.cards.length}`}</Button>}
        </div>
    )
}

