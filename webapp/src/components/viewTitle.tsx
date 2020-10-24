// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape, FormattedMessage} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {Board} from '../blocks/board'
import mutator from '../mutator'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'

import {Editable} from './editable'
import Button from './button'

type Props = {
    board: Board
    intl: IntlShape
}

type State = {
    isHoverOnCover: boolean
}

class ViewTitle extends React.Component<Props, State> {
    shouldComponentUpdate(): boolean {
        return true
    }

    constructor(props: Props) {
        super(props)
        this.state = {isHoverOnCover: false}
    }

    render(): JSX.Element {
        const {board} = this.props

        return (
            <>
                <div
                    className='octo-hovercontrols'
                    onMouseOver={() => {
                        this.setState({isHoverOnCover: true})
                    }}
                    onMouseLeave={() => {
                        this.setState({isHoverOnCover: false})
                    }}
                >
                    <Button
                        style={{display: (!board.icon && this.state.isHoverOnCover) ? null : 'none'}}
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

                <div className='octo-icontitle'>
                    {board.icon &&
                        <MenuWrapper>
                            <div className='octo-button octo-icon'>{board.icon}</div>
                            <Menu>
                                <FormattedMessage
                                    id='TableComponent.random-icon'
                                    defaultMessage='Random'
                                >
                                    {(text: string) => (
                                        <Menu.Text
                                            id='random'
                                            name={text}
                                            onClick={() => mutator.changeIcon(board, BlockIcons.shared.randomIcon())}
                                        />
                                    )}
                                </FormattedMessage>
                                <FormattedMessage
                                    id='TableComponent.remove-icon'
                                    defaultMessage='Remove Icon'
                                >
                                    {(text: string) => (
                                        <Menu.Text
                                            id='remove'
                                            name={text}
                                            onClick={() => mutator.changeIcon(board, undefined, 'remove icon')}
                                        />
                                    )}
                                </FormattedMessage>
                            </Menu>
                        </MenuWrapper>}
                    <FormattedMessage
                        id='TableComponent.remove-icon'
                        defaultMessage='Remove Icon'
                    >
                        {(placeholder: string) => (
                            <Editable
                                className='title'
                                text={board.title}
                                placeholderText={placeholder}
                                onChanged={(text) => {
                                    mutator.changeTitle(board, text)
                                }}
                            />
                        )}
                    </FormattedMessage>
                </div>
            </>
        )
    }
}

export default injectIntl(ViewTitle)
