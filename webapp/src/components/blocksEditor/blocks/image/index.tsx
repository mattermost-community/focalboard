import React, {useRef, useEffect} from 'react'
import {BlockInputProps, ContentType} from '../types'

import './image.scss'

type FileInfo = {
    file: string|ArrayBuffer
    width?: number
    align?: 'left'|'center'|'right'
}

const Image: ContentType<FileInfo> = {
    name: 'image',
    displayName: 'Image',
    slashCommand: '/image',
    prefix: '',
    runSlashCommand: (): void => {},
    editable: false,
    Display: (props: BlockInputProps<FileInfo>) => {
        if (props.value.file) {
            return <img className='ImageView' src={props.value.file as string}/>
        }
        return null
    },
    Input: (props: BlockInputProps<FileInfo>) => {
        const ref = useRef<HTMLInputElement|null>(null)
        useEffect(() => {
            ref.current?.click()
        }, [])

        return (
            <div>
                {props.value.file && (typeof props.value.file === 'string') && (
                    <img
                        className='ImageView' src={props.value.file}
                        onClick={() => ref.current?.click()}
                    />
                )}
                <input
                    ref={ref}
                    className='Image'
                    type='file'
                    accept='image/*'
                    onChange={(e) => {
                        const reader = new FileReader();
                        const file = (e.currentTarget?.files || [])[0]
                        reader.readAsArrayBuffer(file);
                        reader.onload = function () {
                            props.onSave({file: reader.result as ArrayBuffer})
                        }
                    }}
                />
            </div>
        )
    }
}

Image.runSlashCommand = (changeType: (contentType: ContentType<FileInfo>) => void, changeValue: (value: FileInfo) => void): void => {
    changeType(Image)
    changeValue({file: ''})
}

export default Image
