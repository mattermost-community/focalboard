// Copyright (c) 2024-present Midnight.Works. All Rights Reserved.

import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import './checklist.scss';
import mutator from '../../mutator';
import { PropertyProps } from '../types';
import { Card } from '../../blocks/card';
import { Board } from '../../blocks/board';
import DeletePropertyModal from '../deletePropertyModal'

import './list.scss'
import CloseIcon from '../../widgets/icons/close';
import {Utils} from '../../utils';
import {BoardView} from '../../blocks/boardView';

interface Item {
    id: number
    value: string;
    checked: boolean;
}

type ListProps = {
    card: Card;
    board: Board;
    cards: Card[];
    views: BoardView[];
    readOnly: boolean;
    listTitle: string;  
    itemsData: Item[]; 
    propertyId: string;
};

const List: React.FC<ListProps> = ({ card, board, readOnly, listTitle, itemsData, propertyId, views, cards }) => {
    const [items, setItems] = useState<Item[]>(itemsData);
    const [title, setTitle] = useState(listTitle);
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingItem, setIsEditingItem] = useState(false);
    const [progress, setProgress] = useState(() => 0);
    const [editableId, setEditableId] = useState<number | null>(null);
    const [idForItem, setIdForItem] = useState(1)
    const [shouldSync, setShouldSync] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
    const [originalValue, setOriginalValue] = useState('');
    const [newItem, setNewItem] = useState<Item | undefined>();

    const calculateProgress = () => {
        const totalItems = itemsData.filter(item => item.value !== '').length;
        const checkedItems = items.filter(item => item.checked).length;
        return totalItems > 0 ? (checkedItems / totalItems) : 0;
    };

    useEffect(() => {
        if (shouldSync) {
            const jsonValue = {
                title: title,
                items: items
            };
            mutator.changePropertyValue(board.id, card, propertyId, JSON.stringify(jsonValue));
            setShouldSync(false);
        }
        setProgress(calculateProgress());
    }, [shouldSync, items]); 

    useEffect(() => {
        setItems(itemsData);

        if (itemsData.length > 0) {
            const maxId = itemsData.reduce((max, item) => Math.max(max, item.id), 0);
            setIdForItem(maxId + 1);
        }
    }, [itemsData]);

    useEffect(() => {
        setTitle(listTitle);
    }, [listTitle]);

    useEffect(() => {

    }, [editableId]);
    
    // Title section
    
    const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setTitle(event.target.value);
    };

    const handleTitleClick = () => {
        if (!readOnly) {
            setIsEditing(true);
        }
    };

    const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            setIsEditing(false);
            setIsEditingItem(false);
        }
    };

    const handleBlur = () => {
        setTimeout(() => {
            if (!isEditing) return; 
            setIsEditing(false);
        }, 150);
    };  

    const saveTitle = () => {
        const jsonValue = {
            title: title
        }
        mutator.changePropertyValue(board.id, card, propertyId, JSON.stringify(jsonValue))
        setIsEditing(false)
    };

    const deleteList = (propertyId: string) => {
        try {
            mutator.deleteProperty(board, views, cards, propertyId)
        } catch (err: any) {
            Utils.logError(`Error Deleting Property!: Could Not delete Property -" + ${propertyId} ${err?.toString()}`)
        }
    }

    // Items section

    const toggleItem = (id: number) => {
        if (readOnly) return;
        setItems(items => items.map(item => 
            item.id === id ? { ...item, checked: !item.checked } : item
        ));

        setShouldSync(true); 
    };

    const addItem = () => {
        if (readOnly || isEditingItem) return;
        setIdForItem(prevId => {
            const newId = prevId + 1; 
            setNewItem({ id: newId, value: '', checked: false });
            return newId; 
        });
    };    
    
    const handleItemChange = (event: ChangeEvent<HTMLInputElement>, id: number) => {
        event.preventDefault(); 
        event.stopPropagation();

        const value = event.target.value;
        setItems(items => items.map(item =>
            item.id === id ? { ...item, value: value } : item
        ));

        if (newItem) {
            setNewItem(prevItem => {
                if (!prevItem) return { id: 0, value: value, checked: false }; 
                return { ...prevItem, value: value };
            });
        }
    };

    const handleItemClick = (id: number) => {
        if (!readOnly) {
            setIsEditingItem(true);
            setEditableId(id); 
        }
    };

    const handleItemFocus = (id: number) => {
        const currentItem = items.find(item => item.id === id);
        if (currentItem) {
            setOriginalValue(currentItem.value);
        }
    };
    
    const handleKeyPressItems = (event: KeyboardEvent<HTMLInputElement>, id: number): void => {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            if (isEditingItem) {
                setIsEditingItem(false);
                setEditableId(null);
                saveItem(id, true, () => addItem());  
            } else {
                saveItem(id, false, () => addItem()); 
            }
        }
    };
    
    const saveItem = (id: number, fromClick: boolean = false, callback?: () => void) => {
        setItems(prevItems => {
            let itemsToProcess = [...prevItems];
            const exists = newItem && prevItems.some(item => item.id === newItem.id);
            itemsToProcess = exists ? prevItems : [...prevItems, newItem].filter(Boolean) as Item[];
            const updatedItems = itemsToProcess.map(item =>
                item.id === id ? { ...item, value: item.value.trim() } : item
            ).filter(item => item.value !== '');
    
            return updatedItems;
        });
        setShouldSync(true);
    
        setTimeout(() => {
            if (!fromClick) {
                addItem();
            } else {
                setNewItem(undefined);
            }
        }, 0);
    };
    

    const handleBlurItem = (id: number) => {
        const currentItem = items.find(item => item.id === id);
        setIsEditingItem(false);
        
        setTimeout(() => {
            setNewItem(undefined)

            if (!currentItem) {
                console.error('No item found with ID:', id);
                return;
            }
            
            if (currentItem.value.trim().length === 0) {
                if (originalValue !== '') {
                    setItems(items.map(item =>
                        item.id === id ? { ...item, value: originalValue } : item
                    ));
                } else {
                    setItems(items.filter(item => item.id !== id));
                }
            } else {
                setItems(items.map(item =>
                    item.id === id ? { ...item, value: currentItem.value.trim() } : item
                ));
            }

            setEditableId(null);
        }, 150);
    };
        
    const deleteItem = (id: number) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
        setShouldSync(true); 
    }

    // delete modal

    const promptDeleteItem = (id: string) => {
        setDeleteCandidateId(id);
        setShowDeleteModal(true);
    }
    
    const handleConfirmDelete = () => {
        if (deleteCandidateId !== null) {
            deleteList(deleteCandidateId);
            setShowDeleteModal(false);
            setDeleteCandidateId(null);
        }
    };
    
    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setDeleteCandidateId(null);
    };

    return (
        <div className="checklist-container">
            <div>
                {isEditing ? (
                    <div className='checklist-title-save'>
                        <input
                            type="text"
                            value={title}
                            onChange={handleTitleChange}
                            onBlur={handleBlur}
                            onKeyPress={handleKeyPress}
                            autoFocus
                        />
                        <button
                            type='button'
                            onClick={saveTitle}>Save</button>
                    </div>
                ) : (
                    <div className='title-section'>
                        <div className='title' onClick={handleTitleClick}>{title}</div>
                        <button onClick={() => promptDeleteItem(propertyId)}>Delete</button>

                        {showDeleteModal && (
                            <DeletePropertyModal
                                onClose={handleCancelDelete}
                                onConfirm={handleConfirmDelete}
                                message='Deleting a checklist is permanent and there is no way to get it back.'
                                title={title}
                            />
                        )}
                    </div>
                )}
            </div>

            <div className='progress'>
                <div>{Math.round(progress * 100)}%</div>
                <progress className='progress-bar' max="1" value={progress} />
            </div>        

            <ul className='items-list'>
                {items.map((item) => (
                    <li className={`item ${item.checked ? 'line-through' : ''}`} key={item.id}>
                        {editableId !== item.id && (
                            <input 
                                type="checkbox" 
                                checked={item.checked} 
                                readOnly={readOnly} 
                                onChange={() => {}}
                                onClick={() => toggleItem(item.id)} 
                            />                        
                        )}
                        {!newItem && editableId === item.id ? (
                            <div className='item-edit'>
                                <input
                                    type="text"
                                    value={item.value || ''}
                                    onChange={(e) => handleItemChange(e, item.id)}
                                    onBlur={() => handleBlurItem(item.id)} 
                                    onKeyPress={(e) => handleKeyPressItems(e, item.id)}
                                    onFocus={() => handleItemFocus(item.id)}
                                    autoFocus
                                    required
                                />
                                <button
                                    type='button'
                                    onClick={() => saveItem(item.id, true)}>Save</button>           
                            </div>
                        ) : ( 
                            <div className='item-value'>
                                <div 
                                    className='item-text' 
                                    onClick={() => handleItemClick(item.id)}>{item.value}</div>
                                <button
                                    onClick={() => deleteItem(item.id)}>
                                    <CloseIcon />
                                </button>
                            </div>
                        )}
                    </li>
                ))}
                {newItem && !editableId && (
                    <div className='item-edit'>
                        <input
                            type="text"
                            value={newItem.value || ''}
                            onChange={(e) => handleItemChange(e, idForItem)}
                            onBlur={() => handleBlurItem(idForItem)} 
                            onKeyPress={(e) => handleKeyPressItems(e, idForItem)}
                            onFocus={() => handleItemFocus(idForItem)}
                            autoFocus
                            required
                        />
                        <button
                            type='button'
                            onClick={() => saveItem(idForItem, true)}>Save</button>           
                    </div>
                )}

                {!readOnly && editableId === null && !newItem && (
                    <button onClick={addItem}>Add an item</button>
                )}
            </ul>
           
        </div>
    );
};

export default List;
