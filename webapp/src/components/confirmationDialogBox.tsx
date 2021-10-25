// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {FormattedMessage} from 'react-intl'

import Button from '../widgets/buttons/button'

import Dialog from './dialog'
import './confirmationDialogBox.scss'

type ConfirmationDialogBoxProps = {
    heading: string
    subText?: string
    confirmButtonText?: string
    onConfirm: () => void
    onClose: () => void
}

type Props = {
    dialogBox: ConfirmationDialogBoxProps
}

const ConfirmationDialogBox = (props: Props) => {
    return (
        <Dialog
            className='confirmation-dialog-box'
            onClose={props.dialogBox.onClose}
        >
            <div className='box-area' title='Confirmation Dialog Box'>
                <h3 className='heading'>{props.dialogBox.heading}</h3>
                <p className='sub-text'>{props.dialogBox.subText}</p>

                <div className='action-buttons'>
                    <Button
                        title='Cancel'
                        active={true}
                        onClick={props.dialogBox.onClose}
                    >
                        <FormattedMessage
                            id='ConfirmationDialog.cancel-action'
                            defaultMessage='Cancel'
                        />
                    </Button>
                    <Button
                        title={props.dialogBox.confirmButtonText || 'Confirm'}
                        submit={true}
                        emphasis='danger'
                        onClick={props.dialogBox.onConfirm}
                    >
                        { props.dialogBox.confirmButtonText ||
                        <FormattedMessage
                            id='ConfirmationDialog.confirm-action'
                            defaultMessage='Confirm'
                        />
                        }
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default ConfirmationDialogBox
export {ConfirmationDialogBoxProps}
