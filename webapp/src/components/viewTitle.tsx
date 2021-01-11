// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {Board} from '../blocks/board'
import mutator from '../mutator'
import Button from '../widgets/buttons/button'
import Editable from '../widgets/editable'
import EmojiIcon from '../widgets/icons/emoji'
import HideIcon from '../widgets/icons/hide'
import ShowIcon from '../widgets/icons/show'

import BlockIconSelector from './blockIconSelector'
import {MarkdownEditor} from './markdownEditor'
import './viewTitle.scss'

type Props = {
    board: Board
    intl: IntlShape
    readonly: boolean
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
                <div className='ViewTitle add-buttons add-visible'>
                    {!this.props.readonly && !board.icon &&
                        <Button
                            onClick={() => {
                                const newIcon = BlockIcons.shared.randomIcon()
                                mutator.changeIcon(board, newIcon)
                            }}
                            icon={<EmojiIcon/>}
                        >
                            <FormattedMessage
                                id='TableComponent.add-icon'
                                defaultMessage='Add icon'
                            />
                        </Button>
                    }
                    {!this.props.readonly && board.showDescription &&
                        <Button
                            onClick={() => {
                                mutator.showDescription(board, false)
                            }}
                            icon={<HideIcon/>}
                        >
                            <FormattedMessage
                                id='ViewTitle.hide-description'
                                defaultMessage='hide description'
                            />
                        </Button>
                    }
                    {!this.props.readonly && !board.showDescription &&
                        <Button
                            onClick={() => {
                                mutator.showDescription(board, true)
                            }}
                            icon={<ShowIcon/>}
                        >
                            <FormattedMessage
                                id='ViewTitle.show-description'
                                defaultMessage='show description'
                            />
                        </Button>
                    }
                </div>

                <div className='ViewTitle'>
                    <BlockIconSelector block={board}/>
                    <Editable
                        ref={this.titleEditor}
                        className='title'
                        value={this.state.title}
                        placeholderText={intl.formatMessage({id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled board'})}
                        onChange={(title) => this.setState({title})}
                        saveOnEsc={true}
                        onSave={() => mutator.changeTitle(board, this.state.title)}
                        onCancel={() => this.setState({title: this.props.board.title})}
                        readonly={this.props.readonly}
                    />
                </div>

                {board.showDescription &&
                    <div className='ViewTitle description'>
                        <MarkdownEditor
                            text={board.description}
                            placeholderText='Add a description...'
                            onBlur={(text) => {
                                mutator.changeDescription(board, text)
                            }}
                            readonly={this.props.readonly}
                        />
                    </div>
                }
            </>
        )
    }
}

export default injectIntl(ViewTitle)
