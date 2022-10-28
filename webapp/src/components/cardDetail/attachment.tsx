// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {useIntl} from 'react-intl'

import FileElement from '../../components/content/fileElement'
import {AttachmentBlock} from '../../blocks/fileBlock'

import './attachment.scss'
import {Block} from '../../blocks/block'
import CompassIcon from '../../widgets/icons/compassIcon'

type Props = {
    count: number
    attachments: AttachmentBlock[]
    onDelete: (block: Block) => void
    addAttachment: () => void
}

const AttachmentList = (props: Props): JSX.Element => {
    const {count, attachments, onDelete, addAttachment} = props
    const intl = useIntl()

    return (
        <div className='Attachment'>
            <div className='attachment-header'>
                <div className='attachment-title mb-2'>{intl.formatMessage({id: 'Attachment.Attachment-title', defaultMessage: 'Attachment'})} {`(${count})`}</div>
                <div
                    className='attachment-plus-btn'
                    onClick={addAttachment}
                >
                    <CompassIcon
                        icon='plus'
                        className='attachment-plus-icon'
                    />
                </div>
            </div>
            <div className='attachment-content'>
                {attachments.map((block: AttachmentBlock) => {
                    return (
                        <div key={block.id}>
                            <FileElement
                                block={block}
                                onDelete={onDelete}
                            />
                        </div>)
                })
                }
            </div>
        </div>
    )
}

export default AttachmentList
