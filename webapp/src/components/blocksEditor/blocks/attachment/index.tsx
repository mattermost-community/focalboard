import React, {useRef, useEffect} from 'react'
import {BlockInputProps, ContentType} from '../types'

import './attachment.scss'

const Attachment: ContentType = {
    name: 'attachment',
    displayName: 'Attachment',
    slashCommand: '/attachment',
    prefix: '',
    runSlashCommand: (): void => {},
    editable: false,
    Display: (props: BlockInputProps) => <div className='AttachmentView'>📎 {props.value}</div>,
    Input: (props: BlockInputProps) => {
        const ref = useRef<HTMLInputElement|null>(null)
        useEffect(() => {
            ref.current?.click()
        }, [])

        return (
            <input
                ref={ref}
                className='Attachment'
                type='file'
                onChange={(e) => {
                    const files = e.currentTarget?.files
                    if (files) {
                        for (let i = 0; i < files.length; i++) {
                            const file = files.item(i)
                            if (file) {
                                props.onSave(file.name as string)
                            }
                        }
                    }
                }}
            />
        )
    }
}

Attachment.runSlashCommand = (changeType: (contentType: ContentType) => void, changeValue: (value: string) => void): void => {
    changeType(Attachment)
    changeValue('')
}

export default Attachment
