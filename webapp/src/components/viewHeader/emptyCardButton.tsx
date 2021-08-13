// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {useIntl} from 'react-intl'

import CardIcon from '../../widgets/icons/card'
import Menu from '../../widgets/menu'

import {BoardView} from '../../blocks/boardView'
import MenuWrapper from '../../widgets/menuWrapper'
import OptionsIcon from '../../widgets/icons/options'
import IconButton from '../../widgets/buttons/iconButton'
import CheckIcon from '../../widgets/icons/check'
import mutator from '../../mutator'
import './emptyCardButton.scss'

type Props = {
    boardView: BoardView
    addCard: () => void
}

const EmptyCardButton = React.memo((props: Props) => {
    const {boardView} = props
    const intl = useIntl()

    return (
        <Menu.Text
            icon={<CardIcon/>}
            id='empty-template'
            name={intl.formatMessage({id: 'ViewHeader.empty-card', defaultMessage: 'Empty card'})}
            className={boardView.defaultTemplateId ? '' : 'bold-menu-text'}
            onClick={() => {
                props.addCard()
            }}
            rightIcon={
                <MenuWrapper stopPropagationOnToggle={true}>
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <Menu.Text
                            icon={<CheckIcon/>}
                            id='default'
                            name={intl.formatMessage({id: 'ViewHeader.set-default-template', defaultMessage: 'Set as default'})}
                            onClick={async () => {
                                await mutator.setDefaultTemplate(boardView)
                            }}
                        />
                    </Menu>
                </MenuWrapper>
            }
        />)
})

export default EmptyCardButton
