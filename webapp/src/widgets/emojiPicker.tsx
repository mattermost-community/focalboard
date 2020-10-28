// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {FC} from 'react'

import 'emoji-mart/css/emoji-mart.css'
import {Picker, BaseEmoji} from 'emoji-mart'

import './emojiPicker.scss'

type Props = {
    onSelect: (emoji: string) => void
}

const EmojiPicker: FC<Props> = (props: Props): JSX.Element => (
    <div
        className='EmojiPicker'
        onClick={(e) => e.stopPropagation()}
    >
        <Picker
            onSelect={(emoji: BaseEmoji) => props.onSelect(emoji.native)}
        />
    </div>
)

export default EmojiPicker
