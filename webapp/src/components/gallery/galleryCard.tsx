// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useMemo} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {ContentBlock} from '../../blocks/contentBlock'
import {useSortable} from '../../hooks/sortable'
import mutator from '../../mutator'
import {IUser} from '../../user'
import {getMe} from '../../store/users'
import {getCardContents} from '../../store/contents'
import {useAppSelector} from '../../store/hooks'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import {Utils} from '../../utils'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import DuplicateIcon from '../../widgets/icons/duplicate'
import LinkIcon from '../../widgets/icons/Link'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import Tooltip from '../../widgets/tooltip'
import {Permission} from '../../constants'
import {CardDetailProvider} from '../cardDetail/cardDetailContext'
import ContentElement from '../content/contentElement'
import ImageElement from '../content/imageElement'
import {sendFlashMessage} from '../flashMessages'
import PropertyValueElement from '../propertyValueElement'
import './galleryCard.scss'
import CardBadges from '../cardBadges'

import BoardPermissionGate from '../permissions/boardPermissionGate'

type Props = {
    board: Board
    card: Card
    onClick: (e: React.MouseEvent, card: Card) => void
    visiblePropertyTemplates: IPropertyTemplate[]
    visibleTitle: boolean
    isSelected: boolean
    visibleBadges: boolean
    readonly: boolean
    isManualSort: boolean
    onDrop: (srcCard: Card, dstCard: Card) => void
}

const GalleryCard = (props: Props) => {
    const {card, board} = props
    const intl = useIntl()
    const [isDragging, isOver, cardRef] = useSortable('card', card, props.isManualSort && !props.readonly, props.onDrop)
    const contents = useAppSelector(getCardContents(card.id))
    const me = useAppSelector<IUser|null>(getMe)

    const visiblePropertyTemplates = props.visiblePropertyTemplates || []

    const image: ContentBlock|undefined = useMemo(() => {
        for (let i = 0; i < contents.length; ++i) {
            if (Array.isArray(contents[i])) {
                return (contents[i] as ContentBlock[]).find((c) => c.type === 'image')
            } else if ((contents[i] as ContentBlock).type === 'image') {
                return contents[i] as ContentBlock
            }
        }
        return undefined
    }, [contents])

    let className = props.isSelected ? 'GalleryCard selected' : 'GalleryCard'
    if (isOver) {
        className += ' dragover'
    }

    return (
        <div
            className={className}
            onClick={(e: React.MouseEvent) => props.onClick(e, card)}
            style={{opacity: isDragging ? 0.5 : 1}}
            ref={cardRef}
        >
            {!props.readonly &&
                <MenuWrapper
                    className='optionsMenu'
                    stopPropagationOnToggle={true}
                >
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <BoardPermissionGate permissions={[Permission.ManageBoardCards]}>
                            <Menu.Text
                                icon={<DeleteIcon/>}
                                id='delete'
                                name={intl.formatMessage({id: 'GalleryCard.delete', defaultMessage: 'Delete'})}
                                onClick={() => mutator.deleteBlock(card, 'delete card')}
                            />
                            <Menu.Text
                                icon={<DuplicateIcon/>}
                                id='duplicate'
                                name={intl.formatMessage({id: 'GalleryCard.duplicate', defaultMessage: 'Duplicate'})}
                                onClick={() => {
                                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicateCard, {board: board.id, card: card.id})
                                    mutator.duplicateCard(card.id, board.id)
                                }}
                            />
                        </BoardPermissionGate>
                        {me?.id !== 'single-user' &&
                            <Menu.Text
                                icon={<LinkIcon/>}
                                id='copy'
                                name={intl.formatMessage({id: 'GalleryCard.copyLink', defaultMessage: 'Copy link'})}
                                onClick={() => {
                                    let cardLink = window.location.href

                                    if (!cardLink.includes(card.id)) {
                                        cardLink += `/${card.id}`
                                    }

                                    Utils.copyTextToClipboard(cardLink)
                                    sendFlashMessage({content: intl.formatMessage({id: 'GalleryCard.copiedLink', defaultMessage: 'Copied!'}), severity: 'high'})
                                }}
                            />
                        }
                    </Menu>
                </MenuWrapper>
            }

            {image &&
                <div className='gallery-image'>
                    <ImageElement block={image}/>
                </div>}
            {!image &&
                <CardDetailProvider card={card}>
                    <div className='gallery-item'>
                        {contents.map((block) => {
                            if (Array.isArray(block)) {
                                return block.map((b) => (
                                    <ContentElement
                                        key={b.id}
                                        block={b}
                                        readonly={true}
                                        cords={{x: 0}}
                                    />
                                ))
                            }

                            return (
                                <ContentElement
                                    key={block.id}
                                    block={block}
                                    readonly={true}
                                    cords={{x: 0}}
                                />
                            )
                        })}
                    </div>
                </CardDetailProvider>}
            {props.visibleTitle &&
                <div className='gallery-title'>
                    { card.fields.icon ? <div className='octo-icon'>{card.fields.icon}</div> : undefined }
                    <div
                        key='__title'
                        className='octo-titletext'
                    >
                        {card.title ||
                            <FormattedMessage
                                id='KanbanCard.untitled'
                                defaultMessage='Untitled'
                            />}
                    </div>
                </div>}
            {visiblePropertyTemplates.length > 0 &&
                <div className='gallery-props'>
                    {visiblePropertyTemplates.map((template) => (
                        <Tooltip
                            key={template.id}
                            title={template.name}
                            placement='top'
                        >
                            <PropertyValueElement
                                board={board}
                                readOnly={true}
                                card={card}
                                propertyTemplate={template}
                                showEmptyPlaceholder={false}
                            />
                        </Tooltip>
                    ))}
                </div>}
            {props.visibleBadges &&
                <CardBadges
                    card={card}
                    className='gallery-badges'
                />}
        </div>
    )
}

export default React.memo(GalleryCard)
