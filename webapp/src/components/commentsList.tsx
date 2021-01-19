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
    userId: string
    rootId: string
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
        const {userId, rootId, cardId} = this.props

        Utils.assertValue(cardId)

        const comment = new MutableCommentBlock()
        comment.parentId = cardId
        comment.rootId = rootId
        comment.userId = userId
        comment.title = this.state.newComment
        mutator.insertBlock(comment, 'add comment')
        this.setState({newComment: ''})
    }

    public render(): JSX.Element {
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
                        userId={comment.userId}
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
                    />

                    {this.state.newComment &&
                        <Button
                            filled={true}
                            onClick={() => {
                                if (this.state.newComment) {
                                    Utils.log(`Send comment: ${this.state.newComment}`)
                                    this.sendComment()
                                    this.setState({inputFocused: false, newComment: ''})
                                }
                            }}
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
