// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useMemo} from 'react'
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

const CommentsList = React.memo((props: Props) => {
    const [newComment, setNewComment] = useState('')

    const onSendClicked = useMemo(() => () => {
        const commentText = newComment
        if (commentText) {
            const {rootId, cardId} = props
            Utils.log(`Send comment: ${commentText}`)
            Utils.assertValue(cardId)

            const comment = new MutableCommentBlock()
            comment.parentId = cardId
            comment.rootId = rootId
            comment.title = commentText
            mutator.insertBlock(comment, 'add comment')
            setNewComment('')
        }
    }, [])

    const {comments, intl} = props

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
                    text={newComment}
                    placeholderText={intl.formatMessage({id: 'CardDetail.new-comment-placeholder', defaultMessage: 'Add a comment...'})}
                    onChange={(value: string) => {
                        if (newComment !== value) {
                            setNewComment(value)
                        }
                    }}
                    onAccept={onSendClicked}
                />

                {newComment &&
                    <Button
                        filled={true}
                        onClick={onSendClicked}
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
})

export default injectIntl(CommentsList)
