// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {BlockIcons} from '../../blockIcons'
import mutator from '../../mutator'
import {BoardTree} from '../../viewModel/boardTree'
import {CardTree} from '../../viewModel/cardTree'
import Button from '../../widgets/buttons/button'
import Editable from '../../widgets/editable'
import EmojiIcon from '../../widgets/icons/emoji'

import BlockIconSelector from '../blockIconSelector'

import CommentsList from './commentsList'
import CardDetailContents from './cardDetailContents'
import CardDetailContentsMenu from './cardDetailContentsMenu'
import CardDetailProperties from './cardDetailProperties'

import './cardDetail.scss'

type Props = {
    boardTree: BoardTree
    cardTree: CardTree
    intl: IntlShape
    readonly: boolean
}

type State = {
    title: string
}

class CardDetail extends React.Component<Props, State> {
    private titleRef = React.createRef<Editable>()

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidMount(): void {
        if (!this.state.title) {
            this.titleRef.current?.focus()
        }
    }

    componentWillUnmount(): void {
        const {cardTree} = this.props
        if (!cardTree) {
            return
        }
        const {card} = cardTree
        if (this.state.title !== card.title) {
            mutator.changeTitle(card, this.state.title)
        }
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            title: props.cardTree.card.title,
        }
    }

    render() {
        const {boardTree, cardTree} = this.props
        const {board} = boardTree
        if (!cardTree) {
            return null
        }
        const {card, comments} = cardTree

        const icon = card.icon

        return (
            <>
                <div className='CardDetail content'>
                    <BlockIconSelector
                        block={card}
                        size='l'
                        readonly={this.props.readonly}
                    />
                    {!this.props.readonly && !icon &&
                        <div className='add-buttons'>
                            <Button
                                onClick={() => {
                                    const newIcon = BlockIcons.shared.randomIcon()
                                    mutator.changeIcon(card, newIcon)
                                }}
                                icon={<EmojiIcon/>}
                            >
                                <FormattedMessage
                                    id='CardDetail.add-icon'
                                    defaultMessage='Add icon'
                                />
                            </Button>
                        </div>}

                    <Editable
                        ref={this.titleRef}
                        className='title'
                        value={this.state.title}
                        placeholderText='Untitled'
                        onChange={(title: string) => this.setState({title})}
                        saveOnEsc={true}
                        onSave={() => {
                            if (this.state.title !== this.props.cardTree.card.title) {
                                mutator.changeTitle(card, this.state.title)
                            }
                        }}
                        onCancel={() => this.setState({title: this.props.cardTree.card.title})}
                        readonly={this.props.readonly}
                    />

                    {/* Property list */}

                    <CardDetailProperties
                        boardTree={this.props.boardTree}
                        cardTree={this.props.cardTree}
                        readonly={this.props.readonly}
                    />

                    {/* Comments */}

                    {!this.props.readonly &&
                    <>
                        <hr/>
                        <CommentsList
                            comments={comments}
                            rootId={card.rootId}
                            cardId={card.id}
                        />
                        <hr/>
                    </>
                    }
                </div>

                {/* Content blocks */}

                <div className='CardDetail content fullwidth'>
                    <CardDetailContents
                        cardTree={this.props.cardTree}
                        readonly={this.props.readonly}
                    />
                </div>

                {!this.props.readonly &&
                    <CardDetailContentsMenu card={this.props.cardTree.card}/>
                }
            </>
        )
    }
}

export default injectIntl(CardDetail)
