// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, IntlShape, injectIntl} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {MutableTextBlock} from '../blocks/textBlock'
import {BoardTree} from '../viewModel/boardTree'
import {PropertyType} from '../blocks/board'
import {CardTree, MutableCardTree} from '../viewModel/cardTree'
import mutator from '../mutator'
import {OctoListener} from '../octoListener'
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
    cardId: string
    intl: IntlShape
}

type State = {
    cardTree?: CardTree
    title: string
}

class CardDetail extends React.Component<Props, State> {
    private titleRef = React.createRef<Editable>()
    private cardListener?: OctoListener

    shouldComponentUpdate() {
        return true
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            title: '',
        }
    }

    componentDidMount() {
        const cardTree = new MutableCardTree(this.props.cardId)
        this.cardListener = new OctoListener()
        this.cardListener.open([this.props.cardId], async (blocks) => {
            Utils.log(`cardListener.onChanged: ${blocks.length}`)
            const newCardTree = cardTree.mutableCopy()
            newCardTree.incrementalUpdate(blocks)
            this.setState({cardTree: newCardTree})
        })
        cardTree.sync().then(() => {
            this.setState({cardTree, title: cardTree.card.title})
            setTimeout(() => {
                if (this.titleRef.current) {
                    this.titleRef.current.focus()
                }
            }, 0)
        })
    }

    componentWillUnmount() {
        this.cardListener?.close()
        this.cardListener = undefined
    }

    render() {
        const {boardTree, intl} = this.props
        const {cardTree} = this.state
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
                            cardId={card.id}
                            cardTree={cardTree}
                        />
                    ))}
                </div>)
        } else {
            contentElements = (<div className='octo-content'>
                <div className='octo-block'>
                    <div className='octo-block-margin'/>
                    <MarkdownEditor
                        text=''
                        placeholderText='Add a description...'
                        onBlur={(text) => {
                            if (text) {
                                const block = new MutableTextBlock()
                                block.parentId = card.id
                                block.title = text
                                block.order = cardTree.contents.length * 1000
                                mutator.insertBlock(block, 'add card text')
                            }
                        }}
                    />
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
                    />
                    {!icon &&
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
                                    defaultMessage='Add Icon'
                                />
                            </Button>
                        </div>}

                    <Editable
                        ref={this.titleRef}
                        className='title'
                        value={this.state.title}
                        placeholderText='Untitled'
                        onChange={(title: string) => this.setState({title})}
                        onSave={() => mutator.changeTitle(card, this.state.title)}
                        onCancel={() => this.setState({title: this.state.cardTree.card.title})}
                    />

                    {/* Property list */}

                    <div className='octo-propertylist'>
                        {board.cardProperties.map((propertyTemplate) => {
                            return (
                                <div
                                    key={propertyTemplate.id}
                                    className='octo-propertyrow'
                                >
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
                                    <PropertyValueElement
                                        readOnly={false}
                                        card={card}
                                        boardTree={boardTree}
                                        propertyTemplate={propertyTemplate}
                                        emptyDisplayValue='Empty'
                                    />
                                </div>
                            )
                        })}

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
                    </div>

                    {/* Comments */}

                    <hr/>
                    <CommentsList
                        comments={comments}
                        cardId={card.id}
                    />
                    <hr/>
                </div>

                {/* Content blocks */}

                <div className='CardDetail content fullwidth'>
                    {contentElements}
                </div>

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
                                    block.order = cardTree.contents.length * 1000
                                    mutator.insertBlock(block, 'add text')
                                }}
                            />
                            <Menu.Text
                                id='image'
                                name={intl.formatMessage({id: 'CardDetail.image', defaultMessage: 'Image'})}
                                onClick={() => Utils.selectLocalFile(
                                    (file) => mutator.createImageBlock(card.id, file, cardTree.contents.length * 1000),
                                    '.jpg,.jpeg,.png',
                                )}
                            />

                        </Menu>
                    </MenuWrapper>
                </div>
            </>
        )
    }
}

export default injectIntl(CardDetail)
