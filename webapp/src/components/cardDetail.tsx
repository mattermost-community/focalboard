// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, IntlShape, injectIntl} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {MutableTextBlock} from '../blocks/textBlock'
import {BoardTree} from '../viewModel/boardTree'
import {PropertyType} from '../blocks/board'
import {CardTree} from '../viewModel/cardTree'
import mutator from '../mutator'
import {Utils} from '../utils'

import MenuWrapper from '../widgets/menuWrapper'
import Menu from '../widgets/menu'
import PropertyMenu from '../widgets/propertyMenu'
import Editable from '../widgets/editable'
import Button from '../widgets/buttons/button'
import EmojiIcon from '../widgets/icons/emoji'

import {MarkdownEditor} from './markdownEditor'
import ContentBlock from './contentBlock'
import CommentsList from './commentsList'
import BlockIconSelector from './blockIconSelector'
import PropertyValueElement from './propertyValueElement'

import './cardDetail.scss'

type Props = {
    boardTree: BoardTree
    cardTree: CardTree
    intl: IntlShape
    readonly: boolean
}

type State = {
    title: string
}

class CardDetail extends React.Component<Props, State> {
    private titleRef = React.createRef<Editable>()

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidMount(): void {
        if (!this.state.title) {
            this.titleRef.current?.focus()
        }
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            title: props.cardTree.card.title,
        }
    }

    render() {
        const {boardTree, cardTree, intl} = this.props
        const {board} = boardTree
        if (!cardTree) {
            return null
        }
        const {card, comments} = cardTree

        let contentElements
        if (cardTree.contents.length > 0) {
            contentElements =
                (<div className='octo-content'>
                    {cardTree.contents.map((block) => (
                        <ContentBlock
                            key={block.id}
                            block={block}
                            card={card}
                            contents={cardTree.contents}
                            readonly={this.props.readonly}
                        />
                    ))}
                </div>)
        } else {
            contentElements = (<div className='octo-content'>
                <div className='octo-block'>
                    <div className='octo-block-margin'/>
                    {!this.props.readonly &&
                        <MarkdownEditor
                            text=''
                            placeholderText='Add a description...'
                            onBlur={(text) => {
                                if (text) {
                                    const block = new MutableTextBlock()
                                    block.parentId = card.id
                                    block.rootId = card.rootId
                                    block.title = text
                                    block.order = (this.props.cardTree.contents.length + 1) * 1000
                                    mutator.insertBlock(block, 'add card text')
                                }
                            }}
                        />
                    }
                </div>
            </div>)
        }

        const icon = card.icon

        return (
            <>
                <div className='CardDetail content'>
                    <BlockIconSelector
                        block={card}
                        size='l'
                        readonly={this.props.readonly}
                    />
                    {!this.props.readonly && !icon &&
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
                        ref={this.titleRef}
                        className='title'
                        value={this.state.title}
                        placeholderText='Untitled'
                        onChange={(title: string) => this.setState({title})}
                        saveOnEsc={true}
                        onSave={() => {
                            if (this.state.title !== this.props.cardTree.card.title) {
                                mutator.changeTitle(card, this.state.title)
                            }
                        }}
                        onCancel={() => this.setState({title: this.props.cardTree.card.title})}
                        readonly={this.props.readonly}
                    />

                    {/* Property list */}

                    <div className='octo-propertylist'>
                        {board.cardProperties.map((propertyTemplate) => {
                            return (
                                <div
                                    key={propertyTemplate.id}
                                    className='octo-propertyrow'
                                >
                                    {this.props.readonly && <div className='octo-propertyname'>{propertyTemplate.name}</div>}
                                    {!this.props.readonly &&
                                        <MenuWrapper>
                                            <div className='octo-propertyname'><Button>{propertyTemplate.name}</Button></div>
                                            <PropertyMenu
                                                propertyId={propertyTemplate.id}
                                                propertyName={propertyTemplate.name}
                                                propertyType={propertyTemplate.type}
                                                onNameChanged={(newName: string) => mutator.renameProperty(board, propertyTemplate.id, newName)}
                                                onTypeChanged={(newType: PropertyType) => mutator.changePropertyType(boardTree, propertyTemplate, newType)}
                                                onDelete={(id: string) => mutator.deleteProperty(boardTree, id)}
                                            />
                                        </MenuWrapper>
                                    }
                                    <PropertyValueElement
                                        readOnly={this.props.readonly}
                                        card={card}
                                        boardTree={boardTree}
                                        propertyTemplate={propertyTemplate}
                                        emptyDisplayValue='Empty'
                                    />
                                </div>
                            )
                        })}

                        {!this.props.readonly &&
                            <div className='octo-propertyname add-property'>
                                <Button
                                    onClick={async () => {
                                        // TODO: Show UI
                                        await mutator.insertPropertyTemplate(boardTree)
                                    }}
                                >
                                    <FormattedMessage
                                        id='CardDetail.add-property'
                                        defaultMessage='+ Add a property'
                                    />
                                </Button>
                            </div>
                        }
                    </div>

                    {/* Comments */}

                    {!this.props.readonly &&
                    <>
                        <hr/>
                        <CommentsList
                            comments={comments}
                            cardId={card.id}
                        />
                        <hr/>
                    </>
                    }
                </div>

                {/* Content blocks */}

                <div className='CardDetail content fullwidth'>
                    {contentElements}
                </div>

                {!this.props.readonly &&
                    <div className='CardDetail content add-content'>
                        <MenuWrapper>
                            <Button>
                                <FormattedMessage
                                    id='CardDetail.add-content'
                                    defaultMessage='Add content'
                                />
                            </Button>
                            <Menu position='top'>
                                <Menu.Text
                                    id='text'
                                    name={intl.formatMessage({id: 'CardDetail.text', defaultMessage: 'Text'})}
                                    onClick={() => {
                                        const block = new MutableTextBlock()
                                        block.parentId = card.id
                                        block.rootId = card.rootId
                                        block.order = (this.props.cardTree.contents.length + 1) * 1000
                                        mutator.insertBlock(block, 'add text')
                                    }}
                                />
                                <Menu.Text
                                    id='image'
                                    name={intl.formatMessage({id: 'CardDetail.image', defaultMessage: 'Image'})}
                                    onClick={() => Utils.selectLocalFile(
                                        (file) => mutator.createImageBlock(card, file, (this.props.cardTree.contents.length + 1) * 1000),
                                        '.jpg,.jpeg,.png',
                                    )}
                                />

                            </Menu>
                        </MenuWrapper>
                    </div>
                }
            </>
        )
    }
}

export default injectIntl(CardDetail)
