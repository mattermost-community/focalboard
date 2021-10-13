import React from "react";
import Dialog from "./dialog";
import Button from "../widgets/buttons/button";
import "./confirmationDialogBox.scss";

type Props = {
    propertyId: string;
    onClose: () => void;
    onConfirm: () => void;
    heading: string;
    subText?: string;
};

export const ConfirmationDialogBox = (props: Props) => {
    return (
        <Dialog className="confirmation-dialog-box" onClose={props.onClose}>
            <div className="box-area">
                <h3 className="heading">{props.heading}</h3>
                <p className="sub-text">{props.subText}</p>

                <div className="action-buttons">
                    <Button
                        title="Cancel"
                        active={true}
                        onClick={props.onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        title="Delete"
                        submit={true}
                        emphasis="danger"
                        onClick={props.onConfirm}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </Dialog>
    );
};
