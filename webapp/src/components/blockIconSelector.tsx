// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {Board} from '../blocks/board'
import {Card} from '../blocks/card'
import mutator from '../mutator'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'
import EmojiPicker from '../widgets/emojiPicker'
import EmojiIcon from '../widgets/icons/emoji'
import DeleteIcon from '../widgets/icons/delete'

import './blockIconSelector.scss'

type Props = {
    block: Board|Card
    size?: 's' | 'm' | 'l'
    intl: IntlShape
}

class BlockIconSelector extends React.Component<Props> {
    static defaultProps: Partial<Props> = {
        size: 'm',
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    onSelectEmoji = (emoji: string) => {
        mutator.changeIcon(this.props.block, emoji)

        // Close the menu
        document.body.click()
    }

    render(): JSX.Element | null {
        const {block, intl, size} = this.props
        if (!block.icon) {
            return null
        }
        return (
            <div className='BlockIconSelector'>
                <MenuWrapper>
                    <div className={`octo-icon size-${size}`}><span>{block.icon}</span></div>
                    <Menu>
                        <Menu.Text
                            id='random'
                            icon={<EmojiIcon/>}
                            name={intl.formatMessage({id: 'ViewTitle.random-icon', defaultMessage: 'Random'})}
                            onClick={() => mutator.changeIcon(block, BlockIcons.shared.randomIcon())}
                        />
                        <Menu.SubMenu
                            id='pick'
                            icon={<EmojiIcon/>}
                            name={intl.formatMessage({id: 'ViewTitle.pick-icon', defaultMessage: 'Pick Icon'})}
                        >
                            <EmojiPicker onSelect={this.onSelectEmoji}/>
                        </Menu.SubMenu>
                        <Menu.Text
                            id='remove'
                            icon={<DeleteIcon/>}
                            name={intl.formatMessage({id: 'ViewTitle.remove-icon', defaultMessage: 'Remove Icon'})}
                            onClick={() => mutator.changeIcon(block, '', 'remove icon')}
                        />
                    </Menu>
                </MenuWrapper>
            </div>
        )
    }
}

export default injectIntl(BlockIconSelector)
