// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {BlockTypes} from '../blocks/block'
import {PropertyType} from '../blocks/board'
import {MutableTextBlock} from '../blocks/textBlock'
import mutator from '../mutator'
import {Utils} from '../utils'
import {BoardTree} from '../viewModel/boardTree'
import {CardTree} from '../viewModel/cardTree'
import Button from '../widgets/buttons/button'
import Editable from '../widgets/editable'
import EmojiIcon from '../widgets/icons/emoji'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'
import PropertyMenu from '../widgets/propertyMenu'

import BlockIconSelector from './blockIconSelector'
import './cardDetail.scss'
import CommentsList from './commentsList'
import {ContentHandler, contentRegistry} from './content/contentRegistry'
import ContentBlock from './contentBlock'
import {MarkdownEditor} from './markdownEditor'
import PropertyValueElement from './propertyValueElement'

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

    componentWillUnmount(): void {
        const {cardTree} = this.props
        if (!cardTree) {
            return
        }
        const {card} = cardTree
        if (this.state.title !== card.title) {
            mutator.changeTitle(card, this.state.title)
        }
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            title: props.cardTree.card.title,
        }
    }

    render() {
        const {boardTree, cardTree} = this.props
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
                                    this.addTextBlock(text)
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
                            const propertyValue = card.properties[propertyTemplate.id]
                            return (
                                <div
                                    key={propertyTemplate.id + '-' + propertyTemplate.type + '-' + propertyValue}
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
                            rootId={card.rootId}
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
                                {contentRegistry.contentTypes.map((type) => this.addContentMenu(type))}
                            </Menu>
                        </MenuWrapper>
                    </div>
                }
            </>
        )
    }

    private addContentMenu(type: BlockTypes): JSX.Element {
        const {intl} = this.props

        const handler = contentRegistry.getHandler(type)
        if (!handler) {
            Utils.logError(`addContentMenu, unknown content type: ${type}`)
            return <></>
        }

        return (
            <Menu.Text
                key={type}
                id={type}
                name={handler.getDisplayText(intl)}
                icon={handler.getIcon()}
                onClick={() => {
                    this.addBlock(handler)
                }}
            />
        )
    }

    private async addBlock(handler: ContentHandler) {
        const {intl, cardTree} = this.props
        const {card} = cardTree

        const newBlock = await handler.createBlock()
        newBlock.parentId = card.id
        newBlock.rootId = card.rootId

        const contentOrder = card.contentOrder.slice()
        contentOrder.push(newBlock.id)
        const typeName = handler.getDisplayText(intl)
        const description = intl.formatMessage({id: 'ContentBlock.addElement', defaultMessage: 'add {type}'}, {type: typeName})
        mutator.performAsUndoGroup(async () => {
            await mutator.insertBlock(newBlock, description)
            await mutator.changeCardContentOrder(card, contentOrder, description)
        })
    }

    private addTextBlock(text: string): void {
        const {intl, cardTree} = this.props
        const {card} = cardTree

        const block = new MutableTextBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.title = text

        const contentOrder = card.contentOrder.slice()
        contentOrder.push(block.id)
        mutator.performAsUndoGroup(async () => {
            const description = intl.formatMessage({id: 'CardDetail.addCardText', defaultMessage: 'add card text'})
            await mutator.insertBlock(block, description)
            await mutator.changeCardContentOrder(card, contentOrder, description)
        })
    }
}

export default injectIntl(CardDetail)
