// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useIntl} from 'react-intl'

import RandomIcon from '../widgets/icons/random'
import EmojiPicker from '../widgets/emojiPicker'
import DeleteIcon from '../widgets/icons/delete'
import EmojiIcon from '../widgets/icons/emoji'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'
import './iconSelector.scss'
import {MenuText, MenuSubMenu} from '../widgets/menu/menu'

type Props = {
    readonly?: boolean
    iconElement: any
    onAddRandomIcon: any
    onSelectEmoji: any
    onRemoveIcon: any
}

const IconSelector = React.memo((props: Props) => {
    const intl = useIntl()

    return (
        <div className='IconSelector'>
            {props.readonly && props.iconElement}
            {!props.readonly &&
                <MenuWrapper>
                    {props.iconElement}
                    <Menu>
                        <MenuText
                            id='random'
                            icon={<RandomIcon/>}
                            name={intl.formatMessage({id: 'ViewTitle.random-icon', defaultMessage: 'Random'})}
                            onClick={props.onAddRandomIcon}
                        />
                        <MenuSubMenu
                            id='pick'
                            icon={<EmojiIcon/>}
                            name={intl.formatMessage({id: 'ViewTitle.pick-icon', defaultMessage: 'Pick icon'})}
                        >
                            <EmojiPicker onSelect={props.onSelectEmoji}/>
                        </MenuSubMenu>
                        <MenuText
                            id='remove'
                            icon={<DeleteIcon/>}
                            name={intl.formatMessage({id: 'ViewTitle.remove-icon', defaultMessage: 'Remove icon'})}
                            onClick={props.onRemoveIcon}
                        />
                    </Menu>
                </MenuWrapper>
            }
        </div>
    )
})

export default IconSelector
