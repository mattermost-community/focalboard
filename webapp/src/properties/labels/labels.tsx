// Copyright (c) 2024-present Midnight.Works. All Rights Reserved.

import React, { useState } from 'react';
import './labels.scss';

const colorOptions = [
    { label: 'green', value: '#7EE2B8' },
    { label: 'yellow', value: '#F5CD47' },
    { label: 'orange', value: '#FEA362' },
    { label: 'red', value: '#FD9891' },
    { label: 'purple', value: '#9F8FEF' },
    { label: 'blue', value: '#579DFF' },
];

// Assuming PropertyProps and mutator are properly defined elsewhere
const Labels = () => {
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleSelectColor = (selectedLabel: string) => {
        setSelectedColors((prevSelected) => {
            if (prevSelected.includes(selectedLabel)) {
                return prevSelected.filter((label) => label !== selectedLabel);
            } else {
                return [...prevSelected, selectedLabel];
            }
        });
    };

    return (
        <div className='LabelPicker'>
            {/* Displaying selected colors */}
            <div className='selectedColors'>
                {selectedColors.map((label, index) => {
                    const colorOption = colorOptions.find((option) => option.label === label);
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
                                    checked={selectedColors.includes(color.label)}
                                    onChange={() => handleSelectColor(color.label)}
                                />
                                {/* Clickable color preview */}
                                <div
                                    className='label'
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => handleSelectColor(color.label)}>
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
