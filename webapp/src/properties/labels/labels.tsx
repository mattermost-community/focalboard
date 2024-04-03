// Copyright (c) 2024-present Midnight.Works. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import './labels.scss';
import { debounce } from 'lodash';
import mutator from '../../mutator';
import { PropertyProps } from '../types';

const colorOptions = [
    { label: 'green', value: '#7EE2B8', title: ''},
    { label: 'yellow', value: '#F5CD47', title: ''},
    { label: 'orange', value: '#FEA362', title: ''},
    { label: 'red', value: '#FD9891', title: ''},
    { label: 'purple', value: '#9F8FEF', title: ''},
    { label: 'blue', value: '#579DFF', title: ''},
];


const Labels = (props: PropertyProps) => {
    const {board, card} = props;
    
    const initialLabels = Array.isArray(card.fields.properties.label)
    ? card.fields.properties.label
    : card.fields.properties.label ? [card.fields.properties.label] : [];

    const [selectedColors, setSelectedColors] = useState<string[]>(initialLabels);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const debouncedUpdate = debounce((selectedLabels) => {
            mutator.changePropertyValue(board.id, card, 'label', selectedLabels)
                .then(() => console.log('Labels updated successfully'))
                .catch((error) => console.error('Failed to update labels', error));
        }, 100);
    
        debouncedUpdate(selectedColors);
     
    }, [selectedColors]); 

    const toggleDropdown = () => setIsOpen(!isOpen);
    const handleSelectColor = (selectedLabel: string) => {
        setSelectedColors((prevSelected) => {
            if (prevSelected.includes(selectedLabel)) {
                return prevSelected.filter((value) => value !== selectedLabel);
            } else {
                return [...prevSelected, selectedLabel];
            }
        });
    };

    return (
        <div className='LabelPicker'>
            <div className='selectedColors'>
                {initialLabels.map((value, index) => {
                    const colorOption = colorOptions.find((option) => option.value === value);
                    return (
                        <div key={index} className='colorSelector' style={{ backgroundColor: colorOption?.value }}></div>
                    );
                })}
                <button onClick={toggleDropdown} className='addLabel'>+</button>
            </div>

            <div className='labels'>
                {isOpen && (
                    <div className='colorsDropdown'>
                        {colorOptions.map((color, index) => (
                            <div key={index} className='labelOption'>
                                <input
                                    type="checkbox"
                                    checked={selectedColors.includes(color.value)}
                                    onChange={() => handleSelectColor(color.value)}
                                />
                                <div
                                    className='label'
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => handleSelectColor(color.value)}>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Labels;
