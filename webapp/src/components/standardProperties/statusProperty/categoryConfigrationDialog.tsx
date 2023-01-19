// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {InformationOutlineIcon} from '@mattermost/compass-icons/components'

import React from 'react'
import {FormattedMessage} from 'react-intl'

import PlusIcon from '../../../widgets/icons/plus'

import InfoIcon from '../../../widgets/icons/info'

import Dialog from '../../dialog'

import './categoryConfigrationDialog.scss'
import ActionDialog from '../../actionDialog/actionDialog'

export type StatusCategory = {
    id: string
    title: string
}

type Props = {
    valueCategories: StatusCategory[]
    onClose: () => void
}

const StatusPropertyConfigrationDialog = (props: Props): JSX.Element => {
    const title = (
        <FormattedMessage
            id='statusProperty.configDialog.title'
            defaultMessage='Edit Statuses'
        />
    )
    return (
        <Dialog
            onClose={props.onClose}
            title={title}
            className='StatusPropertyConfigrationDialog'
        >
            <div className='text-heading5'/>
            <div className='text-75'>
                <FormattedMessage
                    id='statusProperty.configDialog.subTitle'
                    defaultMessage='Categorise your status values to represent what each value represents'
                />
            </div>
            <div className='categorySwimlanes'>
                {props.valueCategories.map((valueCategory) => {
                    return (
                        <div
                            key={valueCategory.id}
                            className='categorySwimlane'
                        >
                            <div className='categorySwimlane_Header'>
                                <div className='text-heading1'>
                                    {valueCategory.title}
                                </div>
                                <InfoIcon/>
                                <PlusIcon/>
                            </div>
                            <div className='categorySwimlane_ValueArea'/>
                        </div>
                    )
                })}
            </div>
        </Dialog>
    )
}

export default StatusPropertyConfigrationDialog
