// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {useIntl} from 'react-intl'

import FileElement from '../../components/content/fileElement'
import {ContentBlock} from '../../blocks/contentBlock'

import './attachment.scss'
import {Block} from '../../blocks/block'
import CompassIcon from '../../widgets/icons/compassIcon'

type Props = {
    count: number
    contents: ContentBlock[]
    onDelete: (block: Block) => void
    addAttachment: () => void
}

const Attachment = (props: Props): JSX.Element|null => {
    const {count, contents, onDelete, addAttachment} = props
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
                {contents.map((block: ContentBlock) => {
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

export default Attachment
