// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {CommentBlock, MutableCommentBlock} from '../blocks/commentBlock'
import mutator from '../mutator'
import {Utils} from '../utils'
import Button from '../widgets/buttons/button'

import Comment from './comment'
import './commentsList.scss'
import {MarkdownEditor} from './markdownEditor'

type Props = {
    comments: readonly CommentBlock[]
    rootId: string
    cardId: string
    intl: IntlShape
}

type State = {
    newComment: string
}

class CommentsList extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            newComment: '',
        }
    }

    shouldComponentUpdate() {
        return true
    }

    private sendComment = (commentText: string) => {
        const {rootId, cardId} = this.props

        Utils.assertValue(cardId)

        const comment = new MutableCommentBlock()
        comment.parentId = cardId
        comment.rootId = rootId
        comment.title = commentText
        mutator.insertBlock(comment, 'add comment')
    }

    private onSendClicked = () => {
        const commentText = this.state.newComment
        if (commentText) {
            Utils.log(`Send comment: ${commentText}`)
            this.sendComment(commentText)
            this.setState({newComment: ''})
        }
    }

    render(): JSX.Element {
        const {comments, intl} = this.props

        // TODO: Replace this placeholder
        const userImageUrl = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="fill: rgb(192, 192, 192);"><rect width="100" height="100" /></svg>'

        return (
            <div className='CommentsList'>
                {comments.map((comment) => (
                    <Comment
                        key={comment.id}
                        comment={comment}
                        userImageUrl={userImageUrl}
                        userId={comment.modifiedBy}
                    />
                ))}

                {/* New comment */}

                <div className='commentrow'>
                    <img
                        className='comment-avatar'
                        src={userImageUrl}
                    />
                    <MarkdownEditor
                        className='newcomment'
                        text={this.state.newComment}
                        placeholderText={intl.formatMessage({id: 'CardDetail.new-comment-placeholder', defaultMessage: 'Add a comment...'})}
                        onChange={(value: string) => {
                            if (this.state.newComment !== value) {
                                this.setState({newComment: value})
                            }
                        }}
                        onAccept={this.onSendClicked}
                    />

                    {this.state.newComment &&
                        <Button
                            filled={true}
                            onClick={this.onSendClicked}
                        >
                            <FormattedMessage
                                id='CommentsList.send'
                                defaultMessage='Send'
                            />
                        </Button>
                    }
                </div>
            </div>
        )
    }
}

export default injectIntl(CommentsList)
