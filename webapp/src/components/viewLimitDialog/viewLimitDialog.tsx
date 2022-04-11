// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {FormattedMessage} from "react-intl"

import Dialog from "../dialog"

import upgradeImg from '../../../static/upgrade.png'
import Button from "../../widgets/buttons/button"

type Props = {
    onClose: () => void
}

const ViewLimitDialog = (props: Props): JSX.Element => {
    return (
        <Dialog
            className='ViewLimitDialog'
            onClose={props.onClose}
        >
            <div className='ViewLimitDialog-Body'>
                <div className='hero-img'>
                    <img src={upgradeImg}/>
                </div>
                <h1>
                    <FormattedMessage
                        id='viewLimitReached.title'
                        defaultMessage='Views per board limit reached'
                    />
                </h1>
                <p>
                    <FormattedMessage
                        id='viewLimitReached.body'
                        defaultMessage='Notify your Admin to upgrade to our Professional or Enterprise plan to have unlimited views per boards, unlimited cards, and more.'
                    />
                </p>

                <div className='action-buttons'>
                    <Button
                        title='Close'
                        size='medium'
                        emphasis='tertiary'
                        onClick={() => {}}
                    >
                        <FormattedMessage
                            id='closeDialogFooterBtn'
                            defaultMessage='Close'
                        />
                    </Button>
                    <Button
                        title={'action'}
                        size='medium'
                        submit={true}
                        danger={false}
                        onClick={() => {}}
                        filled={true}
                    >
                        <FormattedMessage
                            id='viewLimitReached.actionBtnText'
                            defaultMessage='Notify Admin'
                        />
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default React.memo(ViewLimitDialog)
