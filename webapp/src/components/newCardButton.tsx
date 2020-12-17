// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import mutator from '../mutator'
import {BoardTree} from '../viewModel/boardTree'
import ButtonWithMenu from '../widgets/buttons/buttonWithMenu'
import IconButton from '../widgets/buttons/iconButton'
import CardIcon from '../widgets/icons/card'
import DeleteIcon from '../widgets/icons/delete'
import OptionsIcon from '../widgets/icons/options'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'

type Props = {
    boardTree: BoardTree
    addCard: () => void
    addCardFromTemplate: (cardTemplateId: string) => void
    addCardTemplate: () => void
    editCardTemplate: (cardTemplateId: string) => void
    intl: IntlShape
}

class NewCardButton extends React.PureComponent<Props> {
    render(): JSX.Element {
        const {intl, boardTree} = this.props

        return (
            <ButtonWithMenu
                onClick={() => {
                    this.props.addCard()
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

                    {boardTree.cardTemplates.map((cardTemplate) => {
                        const displayName = cardTemplate.title || intl.formatMessage({id: 'ViewHeader.untitled', defaultMessage: 'Untitled'})
                        return (
                            <Menu.Text
                                key={cardTemplate.id}
                                id={cardTemplate.id}
                                name={displayName}
                                icon={<div className='Icon'>{cardTemplate.icon}</div>}
                                onClick={() => {
                                    this.props.addCardFromTemplate(cardTemplate.id)
                                }}
                                rightIcon={
                                    <MenuWrapper stopPropagationOnToggle={true}>
                                        <IconButton icon={<OptionsIcon/>}/>
                                        <Menu position='left'>
                                            <Menu.Text
                                                id='edit'
                                                name={intl.formatMessage({id: 'ViewHeader.edit-template', defaultMessage: 'Edit'})}
                                                onClick={() => {
                                                    this.props.editCardTemplate(cardTemplate.id)
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
                    })}

                    <Menu.Text
                        id='empty-template'
                        name={intl.formatMessage({id: 'ViewHeader.empty-card', defaultMessage: 'Empty card'})}
                        icon={<CardIcon/>}
                        onClick={() => {
                            this.props.addCard()
                        }}
                    />

                    <Menu.Text
                        id='add-template'
                        name={intl.formatMessage({id: 'ViewHeader.add-template', defaultMessage: '+ New template'})}
                        onClick={() => this.props.addCardTemplate()}
                    />
                </Menu>
            </ButtonWithMenu>
        )
    }
}

export default injectIntl(NewCardButton)
