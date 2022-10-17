// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import FileElement from '../../components/content/fileElement'
import {ContentBlock} from '../../blocks/contentBlock'

import './attachment.scss'
import {Block} from '../../blocks/block'

type Props = {
    count: number
    contents: ContentBlock[]
    onDelete: (block: Block) => void
}

const Attachment = (props: Props): JSX.Element|null => {
    const {count, contents, onDelete} = props
    return (
        <div className='Attachment'>
            <h4>{'Attachments'} {`(${count})`}</h4>
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
