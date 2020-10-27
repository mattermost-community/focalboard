// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape, FormattedMessage} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {Board} from '../blocks/board'
import mutator from '../mutator'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'
import Editable from '../widgets/editable'
import Button from '../widgets/buttons/button'

import './viewTitle.scss'

type Props = {
    board: Board
    intl: IntlShape
}

type State = {
    title: string
}

class ViewTitle extends React.Component<Props, State> {
    private titleEditor = React.createRef<Editable>()
    shouldComponentUpdate(): boolean {
        return true
    }

    constructor(props: Props) {
        super(props)
        this.state = {title: props.board.title}
    }

    render(): JSX.Element {
        const {board, intl} = this.props

        return (
            <>
                <div className={'ViewTitle octo-hovercontrols ' + (board.icon ? '' : 'add-visible')}>
                    <Button
                        onClick={() => {
                            const newIcon = BlockIcons.shared.randomIcon()
                            mutator.changeIcon(board, newIcon)
                        }}
                    >
                        <FormattedMessage
                            id='TableComponent.add-icon'
                            defaultMessage='Add Icon'
                        />
                    </Button>
                </div>

                <div className='ViewTitle octo-icontitle'>
                    {board.icon &&
                        <MenuWrapper>
                            <div className='octo-button octo-icon'>{board.icon}</div>
                            <Menu>
                                <Menu.Text
                                    id='random'
                                    name={intl.formatMessage({id: 'ViewTitle.random-icon', defaultMessage: 'Random'})}
                                    onClick={() => mutator.changeIcon(board, BlockIcons.shared.randomIcon())}
                                />
                                <Menu.Text
                                    id='remove'
                                    name={intl.formatMessage({id: 'ViewTitle.remove-icon', defaultMessage: 'Remove Icon'})}
                                    onClick={() => mutator.changeIcon(board, undefined, 'remove icon')}
                                />
                            </Menu>
                        </MenuWrapper>}
                    <Editable
                        ref={this.titleEditor}
                        className='title'
                        value={this.state.title}
                        placeholderText={intl.formatMessage({id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled Board'})}
                        onChange={(title) => this.setState({title})}
                        onSave={() => mutator.changeTitle(board, this.state.title)}
                        onCancel={() => this.setState({title: this.props.board.title})}
                    />
                </div>
            </>
        )
    }
}

export default injectIntl(ViewTitle)
