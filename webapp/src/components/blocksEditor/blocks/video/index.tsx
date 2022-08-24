import React, {useRef, useEffect} from 'react'
import {BlockInputProps, ContentType} from '../types'

import './video.scss'

const Video: ContentType = {
    name: 'video',
    displayName: 'Video',
    slashCommand: '/video',
    prefix: '',
    render: (value: string) => (
        <video width="320" height="240" controls className='VideoView'>
            <source src={value} type='video/mp4'/>
        </video>
    ),
    runSlashCommand: (): void => {},
    Input: (props: BlockInputProps) => {
        const ref = useRef<HTMLInputElement|null>(null)
        useEffect(() => {
            ref.current?.click()
        }, [])

        return (
            <input
                ref={ref}
                className='Video'
                type='file'
                accept='video/*'
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

Video.runSlashCommand = (changeType: (contentType: ContentType) => void, changeValue: (value: string) => void): void => {
    changeType(Video)
    changeValue('')
}

export default Video
