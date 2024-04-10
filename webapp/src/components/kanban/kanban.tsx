// Copyright (c) 2024-present Midnight.Works in association with Sergiu Corjan. All Rights Reserved.

/* eslint-disable max-lines */
import React, {useCallback, useState, useMemo, useEffect} from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import withScrolling, {createHorizontalStrength, createVerticalStrength} from 'react-dnd-scrolling'

import {useAppSelector} from '../../store/hooks'

import {Position} from '../cardDetail/cardDetailContents'

import {Board, IPropertyOption, IPropertyTemplate, BoardGroup} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {BoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import {Utils, IDType} from '../../utils'
import Button from '../../widgets/buttons/button'
import {Constants, Permission} from '../../constants'

import {dragAndDropRearrange} from '../cardDetail/cardDetailContentsUtility'

import {getCurrentBoardTemplates} from '../../store/cards'
import BoardPermissionGate from '../permissions/boardPermissionGate'
import HiddenCardCount from '../../components/hiddenCardCount/hiddenCardCount'

import KanbanCard from './kanbanCard'
import KanbanColumn from './kanbanColumn'
import KanbanColumnHeader from './kanbanColumnHeader'
import KanbanHiddenColumnItem from './kanbanHiddenColumnItem'

import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {getVisibleAndHiddenGroups} from '../../boardUtils'

import {
    getBoardUsers,
} from '../../store/users'
import {ClientConfig} from '../../config/clientConfig'
import {getClientConfig} from '../../store/clientConfig'
import {useIntl} from 'react-intl'


import './kanban.scss'
import { divide, first } from 'lodash'
import Group from 'react-select/dist/declarations/src/components/Group'

type Props = {
    board: Board
    activeView: BoardView
    cards: Card[]
    groupByProperty?: IPropertyTemplate
    visibleGroups: BoardGroup[]
    hiddenGroups: BoardGroup[]
    selectedCardIds: string[]
    intl: IntlShape
    readonly: boolean
    onCardClicked: (e: React.MouseEvent, card: Card) => void
    addCard: (groupByOptionId?: string, show?: boolean) => Promise<void>
    addCardFromTemplate: (cardTemplateId: string, groupByOptionId?: string) => void
    showCard: (cardId?: string) => void
    hiddenCardsCount: number
    showHiddenCardCountNotification: (show: boolean) => void
}

const ScrollingComponent = withScrolling('div')
const hStrength = createHorizontalStrength(Utils.isMobile() ? 60 : 250)
const vStrength = createVerticalStrength(Utils.isMobile() ? 60 : 250)

const Kanban = (props: Props) => {
    const cardTemplates: Card[] = useAppSelector(getCurrentBoardTemplates)
    const {board, activeView, cards, groupByProperty, hiddenGroups, hiddenCardsCount} = props
    const [defaultTemplateID, setDefaultTemplateID] = useState<string>()
    const boardUsers = useAppSelector(getBoardUsers)
    const clientConfig = useAppSelector<ClientConfig>(getClientConfig)
    const intl = useIntl()

    useEffect(() => {
        if (activeView.fields.defaultTemplateId) {
            if (cardTemplates.find((ct) => ct.id === activeView.fields.defaultTemplateId)) {
                setDefaultTemplateID(activeView.fields.defaultTemplateId)
            }
        }
    }, [activeView.fields.defaultTemplateId])

    const propertyValues = groupByProperty?.options || []
    Utils.log(`${propertyValues.length} propertyValues`)

    const visiblePropertyTemplates = useMemo(() => {
        return board.cardProperties.filter(
            (template: IPropertyTemplate) => activeView.fields.visiblePropertyIds.includes(template.id),
        )
    }, [board.cardProperties, activeView.fields.visiblePropertyIds])
    const isManualSort = activeView.fields.sortOptions.length === 0
    const visibleBadges = activeView.fields.visiblePropertyIds.includes(Constants.badgesColumnId)

    const propertyNameChanged = useCallback(async (option: IPropertyOption, text: string): Promise<void> => {
        await mutator.changePropertyOptionValue(board.id, board.cardProperties, groupByProperty!, option, text)
    }, [board, groupByProperty])

    const addGroupClicked = useCallback(async () => {
        Utils.log('onAddGroupClicked')

        const option: IPropertyOption = {
            id: Utils.createGuid(IDType.BlockID),
            value: 'New group',
            color: 'propColorDefault',
        }

        await mutator.insertPropertyOption(board.id, board.cardProperties, groupByProperty!, option, 'add group')
    }, [board, groupByProperty])

    const getUserDisplayName = (boardGroup: BoardGroup) => {
        const user = boardUsers[boardGroup.option.id]
        if (user) {
            return Utils.getUserDisplayName(user, clientConfig.teammateNameDisplay)
        } else if (boardGroup.option.id === 'undefined') {
            return intl.formatMessage({
                id: 'centerPanel.undefined',
                defaultMessage: 'No {propertyName}',
            }, {propertyName: groupByProperty?.name})
        }
        return intl.formatMessage({id: 'centerPanel.unknown-user', defaultMessage: 'Unknown user'})
    }

    const [visibleGroups, setVisibleGroups] = useState(() => {
        const {visible} = getVisibleAndHiddenGroups(
            cards,
            activeView.fields.visibleOptionIds,
            activeView.fields.hiddenOptionIds,
            groupByProperty
        );

        if (groupByProperty?.type === 'createdBy' || groupByProperty?.type === 'updatedBy' || groupByProperty?.type === 'person') {
            if (boardUsers) {
                visible.forEach((value) => {
                    value.option.value = getUserDisplayName(value)
                })
            }
        }
        
        return visible;
    });

    const [showCalculationsMenu, setShowCalculationsMenu] = useState<Map<string, boolean>>(new Map<string, boolean>())
    const toggleOptions = (templateId: string, show: boolean) => {
        const newShowOptions = new Map<string, boolean>(showCalculationsMenu)
        newShowOptions.set(templateId, show)
        setShowCalculationsMenu(newShowOptions)
    }

    if (!groupByProperty) {
        Utils.assertFailure('Board views must have groupByProperty set')
        return <div/>
    }


    useEffect(() => {
        const updateGroups = () => {
            const { visible } = getVisibleAndHiddenGroups(
                cards,
                activeView.fields.visibleOptionIds,
                activeView.fields.hiddenOptionIds,
                groupByProperty
            );
    
            if (groupByProperty?.type === 'createdBy' || groupByProperty?.type === 'updatedBy' || groupByProperty?.type === 'person') {
                if (boardUsers) {
                    visible.forEach((value) => {
                        value.option.value = getUserDisplayName(value)
                    })
                }
            }
    
            setVisibleGroups(visible);
        };
    
        updateGroups();
    }, [cards, activeView, groupByProperty]);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
    
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return; 
        }

        // Update the visible groups state optimistically
        setVisibleGroups(prevVisibleGroups => {
            const sourceIndex = prevVisibleGroups.findIndex(group => group.option.id === source.droppableId);
            const destinationIndex = prevVisibleGroups.findIndex(group => group.option.id === destination.droppableId);
            if ((source.droppableId !== 'columns' && sourceIndex === -1 ) || (destination.droppableId !== 'columns' && destinationIndex === -1)) return prevVisibleGroups;

            // Clone the groups to avoid direct mutation
            const updatedGroups = prevVisibleGroups.map(group => ({ ...group, cards: [...group.cards] }));

            // Prepare for persistence
            const draggedCardIds = props.selectedCardIds.includes(draggableId) ? [...props.selectedCardIds] : [...props.selectedCardIds, draggableId];
            const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card';

            if (destination.droppableId !== 'columns' && source.droppableId !== 'columns') {
                
                // Move the card from source to destination
                const cardBeingMoved = updatedGroups[sourceIndex].cards.find(card => card.id === draggableId);
                if (!cardBeingMoved) return prevVisibleGroups; 

                // Remove card from the source group
                updatedGroups[sourceIndex].cards = updatedGroups[sourceIndex].cards.filter(card => card.id !== draggableId);

                // Add card to the destination group
                updatedGroups[destinationIndex].cards.splice(destination.index, 0, cardBeingMoved);

                let cardOrder = updatedGroups.flatMap(group => group.cards.map(card => card.id));
                try {
                    const draggedCards: Card[] = draggedCardIds
                        .map(id => props.cards.find(card => card.id === id))
                        .filter((card): card is Card => card !== undefined);
                    const propertyUpdates = draggedCards.map(card =>
                        // TypeScript now understands `card` cannot be undefined
                        mutator.changePropertyValue(props.board.id, card, groupByProperty.id, destination.droppableId, description)
                    );
            
                    // Execute property updates and order change in one batch
                    mutator.performAsUndoGroup(async () => {
                        await Promise.all(propertyUpdates);
                        await mutator.changeViewCardOrder(props.board.id, activeView.id, activeView.fields.cardOrder, cardOrder, description)
                    });
        
                } catch (error) {
                    console.error('Failed to persist changes:', error);
                }
                return updatedGroups;
            } else {
                const reorderedColumns = Array.from(prevVisibleGroups);
                const [reorderedColumn] = reorderedColumns.splice(source.index, 1);
                reorderedColumns.splice(destination.index, 0, reorderedColumn);
                
                // Async update for backend (not affecting UI reactivity)
                const newVisibleOptionIds = reorderedColumns.map(group => group.option.id);
                mutator.changeViewVisibleOptionIds(props.board.id, activeView.id, activeView.fields.visibleOptionIds, newVisibleOptionIds);
                
                return reorderedColumns;
            }
        });
    
        // Clear placeholder properties
        setPlaceholderProps({});
    };
    
    
    const [draggedOverColumnId, setDraggedOverColumnId] = useState<string | null>(null);
	const [placeholderProps, setPlaceholderProps] = useState({});
    const queryAttr = "data-rbd-drag-handle-draggable-id";

    const onDragUpdate = (update: DropResult) => {
        if(!update.destination){
          return;
        }
            const draggableId = update.draggableId;
            const destinationIndex = update.destination.index;
    
            const domQuery = `[${queryAttr}='${draggableId}']`;
            const draggedDOM = document.querySelector(domQuery);
    
            if (!draggedDOM) {
                return;
            }
            const { clientHeight, clientWidth } = draggedDOM;

            const destinationColumnId = update.destination.droppableId;
            setDraggedOverColumnId(destinationColumnId);

            if (draggedDOM && draggedDOM.parentNode && draggedDOM.parentNode instanceof Element) {    
                const clientY = parseFloat(window.getComputedStyle(draggedDOM.parentNode).paddingTop) + [...draggedDOM.parentNode.children]
                .slice(0, destinationIndex)
                .reduce((total, curr) => {
                    const style = window.getComputedStyle(curr);
                    const marginBottom = parseFloat(style.marginBottom);
                    return total + curr.clientHeight + marginBottom;
                }, 0);
    
                setPlaceholderProps({
                    clientHeight,
                    clientWidth,
                    clientY,
                    clientX: parseFloat(window.getComputedStyle(draggedDOM.parentNode).paddingLeft)
                });
            }
        };    
    return (
        <DragDropContext onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
            <Droppable droppableId="columns" direction="horizontal" type="column">
                {(provided, snapshot) => (
                    <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className='Kanban'
                    >
                        <div
                            className='octo-board-header'
                            id='mainBoardHeader'
                        >
                            {visibleGroups.map((group, index) => (
                                <Draggable key={group.option.id} draggableId={group.option.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            
                                            style={{
                                                ...provided.draggableProps.style,
                                                  transition: snapshot.isDragging ? 'transform 0.05s linear' : 'none',
                                            }}
                                        >
                                            <div 
                                                className={`drag-column ${draggedOverColumnId === group.option.id ? 'drag-over-active' : ''}`}
                                                style={{
                                                    transform: snapshot.isDragging ? 'rotate(8deg)' : 'none',
                                                    opacity: snapshot.isDragging ? '0.9' : '1'
                                                }}
                                                >
                                                {/* Column headers */}
                                                    <div
                                                        {...provided.dragHandleProps}                                                        
                                                    >
                                                        <KanbanColumnHeader
                                                            key={group.option.id}
                                                            group={group}
                                                            board={board}
                                                            activeView={activeView}
                                                            intl={props.intl}
                                                            groupByProperty={groupByProperty}
                                                            addCard={props.addCard}
                                                            readonly={props.readonly}
                                                            propertyNameChanged={propertyNameChanged}
                                                            calculationMenuOpen={showCalculationsMenu.get(group.option.id) || false}
                                                            onCalculationMenuOpen={() => toggleOptions(group.option.id, true)}
                                                            onCalculationMenuClose={() => toggleOptions(group.option.id, false)}
                                                        />
                                                    </div>
                                                    
                                                {/* Main content */}
                                            
                                                <div
                                                    className='octo-board-body'
                                                    id='mainBoardBody'
                                                >
                                                {/* Columns */}                    
                                                    <KanbanColumn
                                                        key={group.option.id || 'empty'}
                                                        columnId={group.option.id || 'empty'}
                                                        setDraggedOverColumnId={setDraggedOverColumnId}
                                                        placeholderProps={placeholderProps}
                                                        activeDragColumnId={draggedOverColumnId}
                                                    >
                                                        {group.cards.map((card, index) => (
                                                            <KanbanCard
                                                                card={card}
                                                                board={board}
                                                                visiblePropertyTemplates={visiblePropertyTemplates}
                                                                visibleBadges={visibleBadges}
                                                                key={card.id}
                                                                readonly={props.readonly}
                                                                isSelected={props.selectedCardIds.includes(card.id)}
                                                                onClick={props.onCardClicked}
                                                                showCard={props.showCard}
                                                                isManualSort={isManualSort}
                                                                index={index}
                                                            />
                                                        ))}
                                                        {!props.readonly &&
                                                            <BoardPermissionGate permissions={[Permission.ManageBoardCards]}>
                                                                <div className='buttonWrapper'>
                                                                    <Button
                                                                        onClick={() => {
                                                                            if (defaultTemplateID) {
                                                                                props.addCardFromTemplate(defaultTemplateID, group.option.id)
                                                                            } else {
                                                                                props.addCard(group.option.id, true)
                                                                            }
                                                                        }}
                                                                    >
                                                                        <FormattedMessage
                                                                            id='BoardComponentButton.new'
                                                                            defaultMessage='+ Add card'
                                                                        />
                                                                    </Button>
                                                                </div>
                                                                        
                                                            </BoardPermissionGate>
                                                        }
                                                    </KanbanColumn>
                                                </div>
                                                
                                            </div>
                                        </div>
                                    )}
                                </Draggable>                                                           
                            ))}
                            {provided.placeholder}
                            
                                {/* Hidden column header */}

                                    {(hiddenGroups.length > 0 || hiddenCardsCount > 0) &&
                                    <div style={{display: 'blocks'}}>
                                        <div className='octo-board-header-cell narrow'>
                                            <FormattedMessage
                                                id='BoardComponent.hidden-columns'
                                                defaultMessage='Hidden columns'
                                            />
                                        </div>
                                        <div className='octo-board-column narrow'>
                                            {hiddenGroups.map((group) => (
                                                <KanbanHiddenColumnItem
                                                    key={group.option.id}
                                                    group={group}
                                                    activeView={activeView}
                                                    intl={props.intl}
                                                    readonly={props.readonly}
                                                />
                                            ))}
                                            {hiddenCardsCount > 0 &&
                                                <div className='ml-1'>
                                                    <HiddenCardCount
                                                        hiddenCardsCount={hiddenCardsCount}
                                                        showHiddenCardNotification={props.showHiddenCardCountNotification}
                                                /></div>}
                                        </div>
                                    </div>
                                        
                                    }
                                    {(hiddenGroups.length > 0 || hiddenCardsCount > 0) &&
                                        <div></div> }

                                        {!props.readonly &&
                                            <BoardPermissionGate permissions={[Permission.ManageBoardProperties]}>
                                                <div className='octo-board-header-cell narrow'>
                                                    <Button
                                                        onClick={addGroupClicked}
                                                    >
                                                        <FormattedMessage
                                                            id='BoardComponentButton.add-a-group'
                                                            defaultMessage='+ Add list'
                                                        />
                                                    </Button>
                                                </div>
                                            </BoardPermissionGate>
                                        }                       
                                    </div>                       
                                </div>
                            )}
            </Droppable>                    
            {/* </ScrollingComponent> */}
        </DragDropContext>
    )
}

export default injectIntl(Kanban)
