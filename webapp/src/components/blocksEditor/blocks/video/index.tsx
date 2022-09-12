import React, {useRef, useEffect, useState} from 'react'

import {BlockInputProps, ContentType} from '../types'
import octoClient from '../../../../octoClient'
import {useAppSelector} from '../../../../store/hooks'
import {getCurrentBoardId} from '../../../../store/boards'

import './video.scss'

type FileInfo = {
    file: string|File
    filename: string
    width?: number
    align?: 'left'|'center'|'right'
}

const Video: ContentType<FileInfo> = {
    name: 'video',
    displayName: 'Video',
    slashCommand: '/video',
    prefix: '',
    runSlashCommand: (): void => {},
    editable: false,
    Display: (props: BlockInputProps<FileInfo>) => {
        const [videoDataUrl, setVideoDataUrl] = useState<string|null>(null)
        const boardId = useAppSelector(getCurrentBoardId)

        useEffect(() => {
            if (!videoDataUrl) {
                const loadVideo = async () => {
                    if (props.value && props.value.file && typeof props.value.file === 'string') {
                        const fileURL = await octoClient.getFileAsDataUrl(boardId, props.value.file)
                        setVideoDataUrl(fileURL.url || '')
                    }
                }
                loadVideo()
            }
        }, [props.value, props.value.file, boardId])

        if (videoDataUrl) {
            return (
                <video width="320" height="240" controls className='VideoView'>
                    <source src={videoDataUrl}/>
                </video>
            )
        }
        return null
    },
    Input: (props: BlockInputProps<FileInfo>) => {
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
                    const file = (e.currentTarget?.files || [])[0]
                    props.onSave({file: file, filename: file.name})
                }}
            />
        )
    }
}

Video.runSlashCommand = (changeType: (contentType: ContentType<FileInfo>) => void, changeValue: (value: FileInfo) => void): void => {
    changeType(Video)
    changeValue({} as any)
}

export default Video
