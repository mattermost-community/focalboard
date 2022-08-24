import React, {useRef, useEffect} from 'react'
import {BlockInputProps, ContentType} from '../types'

import './image.scss'

const Image: ContentType = {
    name: 'image',
    displayName: 'Image',
    slashCommand: '/image',
    prefix: '',
    render: (value: string) => <img className='ImageView' src={value}/>,
    runSlashCommand: (): void => {},
    Input: (props: BlockInputProps) => {
        const ref = useRef<HTMLInputElement|null>(null)
        useEffect(() => {
            ref.current?.click()
        }, [])

        return (
            <input
                ref={ref}
                className='Image'
                type='file'
                accept='image/*'
                onChange={(e) => {
                    const reader = new FileReader();
                    const file = (e.currentTarget?.files || [])[0]
                    reader.readAsDataURL(file);
                    reader.onload = function () {
                        props.onSave(reader.result as string)
                    }
                }}
            />
        )
    }
}

Image.runSlashCommand = (changeType: (contentType: ContentType) => void, changeValue: (value: string) => void): void => {
    changeType(Image)
    changeValue('')
}

export default Image
