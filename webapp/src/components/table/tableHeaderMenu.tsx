// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
//
import React, {FC} from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {Constants} from '../../constants'
import mutator from '../../mutator'
import {BoardTree} from '../../viewModel/boardTree'
import Menu from '../../widgets/menu'

type Props = {
    templateId: string
    boardTree: BoardTree
    intl: IntlShape
}

const TableHeaderMenu: FC<Props> = (props: Props): JSX.Element => {
    const {boardTree, templateId, intl} = props
    const {board, activeView} = boardTree
    return (
        <Menu>
            <Menu.Text
                id='sortAscending'
                name={intl.formatMessage({id: 'TableHeaderMenu.sort-ascending', defaultMessage: 'Sort ascending'})}
                onClick={() => mutator.changeViewSortOptions(activeView, [{propertyId: templateId, reversed: false}])}
            />
            <Menu.Text
                id='sortDescending'
                name={intl.formatMessage({id: 'TableHeaderMenu.sort-descending', defaultMessage: 'Sort descending'})}
                onClick={() => mutator.changeViewSortOptions(activeView, [{propertyId: templateId, reversed: true}])}
            />
            <Menu.Text
                id='insertLeft'
                name={intl.formatMessage({id: 'TableHeaderMenu.insert-left', defaultMessage: 'Insert left'})}
                onClick={() => {
                    if (props.templateId === Constants.titleColumnId) {
                        // TODO: Handle name column
                    } else {
                        const index = board.cardProperties.findIndex((o) => o.id === templateId)
                        mutator.insertPropertyTemplate(boardTree, index)
                    }
                }}
            />
            <Menu.Text
                id='insertRight'
                name={intl.formatMessage({id: 'TableHeaderMenu.insert-right', defaultMessage: 'Insert right'})}
                onClick={() => {
                    if (templateId === Constants.titleColumnId) {
                        // TODO: Handle title column
                    } else {
                        const index = board.cardProperties.findIndex((o) => o.id === templateId) + 1
                        mutator.insertPropertyTemplate(boardTree, index)
                    }
                }}
            />
            {props.templateId !== Constants.titleColumnId &&
                <>
                    <Menu.Text
                        id='hide'
                        name={intl.formatMessage({id: 'TableHeaderMenu.hide', defaultMessage: 'Hide'})}
                        onClick={() => mutator.changeViewVisibleProperties(activeView, activeView.visiblePropertyIds.filter((o) => o !== templateId))}
                    />
                    <Menu.Text
                        id='duplicate'
                        name={intl.formatMessage({id: 'TableHeaderMenu.duplicate', defaultMessage: 'Duplicate'})}
                        onClick={() => mutator.duplicatePropertyTemplate(boardTree, templateId)}
                    />
                    <Menu.Text
                        id='delete'
                        name={intl.formatMessage({id: 'TableHeaderMenu.delete', defaultMessage: 'Delete'})}
                        onClick={() => mutator.deleteProperty(boardTree, templateId)}
                    />
                </>}
        </Menu>
    )
}

export default injectIntl(TableHeaderMenu)
