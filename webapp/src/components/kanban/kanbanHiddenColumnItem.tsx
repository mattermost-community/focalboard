// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React from 'react'
import {IntlShape} from 'react-intl'

import {IPropertyOption} from '../../blocks/board'
import mutator from '../../mutator'
import {BoardTree, BoardTreeGroup} from '../../viewModel/boardTree'
import Button from '../../widgets/buttons/button'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import ShowIcon from '../../widgets/icons/show'

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

    const ref = React.createRef<HTMLDivElement>()
    return (
        <div
            ref={ref}
            key={group.option.id || 'empty'}
            className='octo-board-hidden-item'
            onDragOver={(e) => {
                if (props.hasDraggedCards) {
                    ref.current?.classList.add('dragover')
                    e.preventDefault()
                }
            }}
            onDragEnter={(e) => {
                if (props.hasDraggedCards) {
                    ref.current?.classList.add('dragover')
                    e.preventDefault()
                }
            }}
            onDragLeave={(e) => {
                if (props.hasDraggedCards) {
                    ref.current?.classList.remove('dragover')
                    e.preventDefault()
                }
            }}
            onDrop={(e) => {
                ref.current?.classList.remove('dragover')
                e.preventDefault()
                if (props.hasDraggedCards) {
                    props.onDropToColumn(group.option)
                }
            }}
        >
            <MenuWrapper
                disabled={props.readonly}
            >
                <div
                    key={group.option.id || 'empty'}
                    className={`octo-label ${group.option.color}`}
                >
                    {group.option.value}
                </div>
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

