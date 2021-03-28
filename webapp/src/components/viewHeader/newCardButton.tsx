// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {BoardTree} from '../../viewModel/boardTree'
import ButtonWithMenu from '../../widgets/buttons/buttonWithMenu'
import CardIcon from '../../widgets/icons/card'
import Menu from '../../widgets/menu'

import NewCardButtonTemplateItem from './newCardButtonTemplateItem'

type Props = {
    boardTree: BoardTree
    addCard: () => void
    addCardFromTemplate: (cardTemplateId: string) => void
    addCardTemplate: () => void
    editCardTemplate: (cardTemplateId: string) => void
    intl: IntlShape
}

const NewCardButton = React.memo((props: Props): JSX.Element => {
    const {intl, boardTree} = props

    return (
        <ButtonWithMenu
            onClick={() => {
                props.addCard()
            }}
            text={(
                <FormattedMessage
                    id='ViewHeader.new'
                    defaultMessage='New'
                />
            )}
        >
            <Menu position='left'>
                {boardTree.cardTemplates.length > 0 && <>
                    <Menu.Label>
                        <b>
                            <FormattedMessage
                                id='ViewHeader.select-a-template'
                                defaultMessage='Select a template'
                            />
                        </b>
                    </Menu.Label>

                    <Menu.Separator/>
                </>}

                {boardTree.cardTemplates.map((cardTemplate) => (
                    <NewCardButtonTemplateItem
                        key={cardTemplate.id}
                        cardTemplate={cardTemplate}
                        addCardFromTemplate={props.addCardFromTemplate}
                        editCardTemplate={props.editCardTemplate}
                    />
                ))}

                <Menu.Text
                    id='empty-template'
                    name={intl.formatMessage({id: 'ViewHeader.empty-card', defaultMessage: 'Empty card'})}
                    icon={<CardIcon/>}
                    onClick={() => {
                        props.addCard()
                    }}
                />

                <Menu.Text
                    id='add-template'
                    name={intl.formatMessage({id: 'ViewHeader.add-template', defaultMessage: '+ New template'})}
                    onClick={() => props.addCardTemplate()}
                />
            </Menu>
        </ButtonWithMenu>
    )
})

export default injectIntl(NewCardButton)
