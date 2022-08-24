import React, {useRef, useEffect} from 'react'
import {marked} from 'marked'

import {BlockInputProps, ContentType} from '../types'

import './h3.scss'

const H3: ContentType = {
    name: 'h3',
    displayName: 'Sub Sub title',
    slashCommand: '/subsubtitle',
    prefix: '### ',
    render: (value: string) => {
        const renderer = new marked.Renderer()
        const html = marked('### '+value, {renderer, breaks: true})
        return <div
            dangerouslySetInnerHTML={{__html: html.trim()}}
        />
    },
    runSlashCommand: (): void => {},
    Input: (props: BlockInputProps) => {
        const ref = useRef<HTMLInputElement|null>(null)
        useEffect(() => {
            ref.current?.focus()
        }, [])
        return (
            <input
                ref={ref}
                className='H3'
                onChange={(e) => props.onChange(e.currentTarget.value)}
                onKeyDown={(e) => {
                    if (props.value === '' && e.key === "Backspace") {
                        props.onCancel()
                    }
                    if (e.key === "Enter") {
                        props.onSave(props.value)
                    }
                }}
                value={props.value}
            />
        )
    }
}

H3.runSlashCommand = (changeType: (contentType: ContentType) => void, changeValue: (value: string) => void, ...args: string[]): void => {
    changeType(H3)
    changeValue(args.join(' '))
}

export default H3
