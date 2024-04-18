import React, { useState } from 'react';
import './ModalProperty.scss'

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (inputValue: string) => void;
}

const ModalProperty: React.FC<ModalProps> = ({ isOpen, onClose, onSave }) => {
    const [inputValue, setInputValue] = useState('');

    if (!isOpen) {
        return null;
    }

    return (
        <div className='Modal-container'>
            <div className="modal-content">
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                <div className='actions'>
                    <div className="action-buttons">
                        <button onClick={onClose}>Close</button>
                        <button onClick={() => onSave(inputValue)}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );      
};

export default ModalProperty;
