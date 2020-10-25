// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape, FormattedMessage} from 'react-intl'

import {MutableCommentBlock} from '../blocks/commentBlock'
import {IBlock} from '../blocks/block'
import {Utils} from '../utils'
import mutator from '../mutator'

import {Editable} from './editable'
import Comment from './comment'

import './commentsList.scss'

type Props = {
    comments: readonly IBlock[]
    cardId: string
    intl: IntlShape
}

class CommentsList extends React.Component<Props> {
    newCommentRef = React.createRef<Editable>()
    sendCommentButtonRef = React.createRef<HTMLDivElement>()

    public shouldComponentUpdate() {
        return true
    }

    private sendComment = (text: string) => {
        const {cardId} = this.props

        Utils.assertValue(cardId)

        const block = new MutableCommentBlock({parentId: cardId, title: text})
        mutator.insertBlock(block, 'add comment')
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
                        ref={this.newCommentRef}
                        className='newcomment'
                        placeholderText={intl.formatMessage({id: 'CardDetail.new-comment-placeholder', defaultMessage: 'Add a comment...'})}
                        onChanged={() => { }}
                        onFocus={() => {
                            this.sendCommentButtonRef.current.style.display = null
                        }}
                        onBlur={() => {
                            if (!this.newCommentRef.current?.text) {
                                this.sendCommentButtonRef.current.style.display = 'none'
                            }
                        }}
                        onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.keyCode === 13 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
                                this.sendCommentButtonRef.current.click()
                            }
                        }}
                    />

                    <div
                        ref={this.sendCommentButtonRef}
                        className='octo-button filled'
                        style={{display: 'none'}}
                        onClick={() => {
                            const text = this.newCommentRef.current.text
                            Utils.log(`Send comment: ${this.newCommentRef.current.text}`)
                            this.sendComment(text)
                            this.newCommentRef.current.text = undefined
                            this.newCommentRef.current.blur()
                        }}
                    >
                        <FormattedMessage
                            id='CommentsList.send'
                            defaultMessage='Send'
                        />
                    </div>
                </div>
            </div>
        )
    }
}

export default injectIntl(CommentsList)
