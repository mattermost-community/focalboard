// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useRef, useEffect} from 'react'
import {FormattedMessage} from 'react-intl'

import {BlockIcons} from '../../blockIcons'
import {Card} from '../../blocks/card'
import {BoardView} from '../../blocks/boardView'
import {Board} from '../../blocks/board'
import {CommentBlock} from '../../blocks/commentBlock.ts'
import {ContentBlock} from '../../blocks/contentBlock'
import mutator from '../../mutator'
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
    board: Board
    activeView: BoardView
    views: BoardView[]
    cards: Card[]
    card: Card
    comments: CommentBlock[]
    contents: ContentBlock[]
    readonly: boolean
}

const CardDetail = (props: Props): JSX.Element|null => {
    const {card, comments} = props
    const [title, setTitle] = useState(card.title)
    const titleRef = useRef<{focus(selectAll?: boolean): void}>(null)
    const titleValueRef = useRef(title)
    titleValueRef.current = title

    useEffect(() => {
        if (!title) {
            titleRef.current?.focus()
        }
    }, [])

    useEffect(() => {
        return () => {
            if (titleValueRef.current !== card.title) {
                mutator.changeTitle(card, titleValueRef.current)
            }
        }
    }, [card])

    if (!card) {
        return null
    }

    return (
        <>
            <div className='CardDetail content'>
                <BlockIconSelector
                    block={card}
                    size='l'
                    readonly={props.readonly}
                />
                {!props.readonly && !card.fields.icon &&
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
                    ref={titleRef}
                    className='title'
                    value={title}
                    placeholderText='Untitled'
                    onChange={(newTitle: string) => setTitle(newTitle)}
                    saveOnEsc={true}
                    onSave={() => {
                        if (title !== props.card.title) {
                            mutator.changeTitle(card, title)
                        }
                    }}
                    onCancel={() => setTitle(props.card.title)}
                    readonly={props.readonly}
                    spellCheck={true}
                />

                {/* Property list */}

                <CardDetailProperties
                    board={props.board}
                    card={props.card}
                    contents={props.contents}
                    comments={props.comments}
                    cards={props.cards}
                    activeView={props.activeView}
                    views={props.views}
                    readonly={props.readonly}
                />

                {/* Comments */}

                {!props.readonly &&
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
                    card={props.card}
                    contents={props.contents}
                    readonly={props.readonly}
                />
            </div>

            {!props.readonly &&
                <CardDetailContentsMenu card={props.card}/>
            }
        </>
    )
}

export default CardDetail
