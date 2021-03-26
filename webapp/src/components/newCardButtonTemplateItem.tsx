// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import mutator from '../mutator'
import {Card} from '../blocks/card'
import IconButton from '../widgets/buttons/iconButton'
import DeleteIcon from '../widgets/icons/delete'
import OptionsIcon from '../widgets/icons/options'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'

type Props = {
    cardTemplate: Card
    addCardFromTemplate: (cardTemplateId: string) => void
    editCardTemplate: (cardTemplateId: string) => void
    intl: IntlShape
}

const NewCardButtonTemplateItem = React.memo((props: Props) => {
    const {intl, cardTemplate} = props
    const displayName = cardTemplate.title || intl.formatMessage({id: 'ViewHeader.untitled', defaultMessage: 'Untitled'})
    return (
        <Menu.Text
            key={cardTemplate.id}
            id={cardTemplate.id}
            name={displayName}
            icon={<div className='Icon'>{cardTemplate.icon}</div>}
            onClick={() => {
                props.addCardFromTemplate(cardTemplate.id)
            }}
            rightIcon={
                <MenuWrapper stopPropagationOnToggle={true}>
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <Menu.Text
                            id='edit'
                            name={intl.formatMessage({id: 'ViewHeader.edit-template', defaultMessage: 'Edit'})}
                            onClick={() => {
                                props.editCardTemplate(cardTemplate.id)
                            }}
                        />
                        <Menu.Text
                            icon={<DeleteIcon/>}
                            id='delete'
                            name={intl.formatMessage({id: 'ViewHeader.delete-template', defaultMessage: 'Delete'})}
                            onClick={async () => {
                                await mutator.deleteBlock(cardTemplate, 'delete card template')
                            }}
                        />
                    </Menu>
                </MenuWrapper>
            }
        />
    )
})

export default injectIntl(NewCardButtonTemplateItem)
