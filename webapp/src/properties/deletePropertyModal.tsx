import React, { useEffect, useRef } from "react";
import './deletePropertyModal.scss'
import CloseIcon from '../widgets/icons/close';

type ModalProps = {
    onClose: () => void;
    onConfirm: () => void;
    title: string | undefined;
    message: string;
};

const DeleteConfirmationModal: React.FC<ModalProps> = ({ onClose, onConfirm, title, message }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    return (
        <div className="delete-modal">
            <div className="modal-container" ref={modalRef}>
                <div onClick={onClose} className="close-button">
                    <CloseIcon />
                </div>
                <div className="modal-title">Delete {title}</div>
                <div className="modal-content">
                    <p>{message}</p>
                    <div>
                        <button className="delete-button" onClick={onConfirm}>Delete</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
