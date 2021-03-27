// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
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

const ViewTitle = React.memo((props: Props) => {
    const [title, setTitle] = useState(props.board.title)

    const {board, intl} = props

    return (
        <>
            <div className='ViewTitle add-buttons add-visible'>
                {!props.readonly && !board.icon &&
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
                {!props.readonly && board.showDescription &&
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
                {!props.readonly && !board.showDescription &&
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
                    className='title'
                    value={title}
                    placeholderText={intl.formatMessage({id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled board'})}
                    onChange={(title) => setTitle(title)}
                    saveOnEsc={true}
                    onSave={() => mutator.changeTitle(board, title)}
                    onCancel={() => setTitle(props.board.title)}
                    readonly={props.readonly}
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
                        readonly={props.readonly}
                    />
                </div>
            }
        </>
    )
})

export default injectIntl(ViewTitle)
