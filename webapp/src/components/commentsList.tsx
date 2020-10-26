// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape, FormattedMessage} from 'react-intl'

import {MutableCommentBlock} from '../blocks/commentBlock'
import {IBlock} from '../blocks/block'
import {Utils} from '../utils'
import mutator from '../mutator'

import Editable from '../widgets/editable'

import Comment from './comment'

import './commentsList.scss'

type Props = {
    comments: readonly IBlock[]
    cardId: string
    intl: IntlShape
}

type State = {
    newComment: string
    inputFocused: boolean
}

class CommentsList extends React.Component<Props, State> {
    public constructor(props: Props) {
        super(props)
        this.state = {
            newComment: '',
            inputFocused: false,
        }
    }

    public shouldComponentUpdate() {
        return true
    }

    private sendComment = () => {
        const {cardId} = this.props

        Utils.assertValue(cardId)

        const block = new MutableCommentBlock({parentId: cardId, title: this.state.newComment})
        mutator.insertBlock(block, 'add comment')
        this.setState({newComment: ''})
    }

    public render(): JSX.Element {
        const {comments, intl} = this.props

        // TODO: Replace this placeholder
        const username = 'John Smith'
        const userImageUrl = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="fill: rgb(192, 192, 192);"><rect width="100" height="100" /></svg>'

        return (
            <div className='CommentsList'>
                {comments.map((comment) => (
                    <Comment
                        key={comment.id}
                        comment={comment}
                        userImageUrl={userImageUrl}
                        username={username}
                    />
                ))}

                {/* New comment */}

                <div className='commentrow'>
                    <img
                        className='comment-avatar'
                        src={userImageUrl}
                    />
                    <Editable
                        className='newcomment'
                        placeholderText={intl.formatMessage({id: 'CardDetail.new-comment-placeholder', defaultMessage: 'Add a comment...'})}
                        onChange={(value: string) => this.setState({newComment: value})}
                        value={this.state.newComment}
                        onSave={() => {
                            this.sendComment()
                        }}
                    />

                    {this.state.newComment &&
                        <div
                            className='octo-button filled'
                            onClick={() => {
                                Utils.log(`Send comment: ${this.state.newComment}`)
                                this.sendComment()
                                this.setState({inputFocused: false, newComment: ''})
                            }}
                        >
                            <FormattedMessage
                                id='CommentsList.send'
                                defaultMessage='Send'
                            />
                        </div>}
                </div>
            </div>
        )
    }
}

export default injectIntl(CommentsList)
