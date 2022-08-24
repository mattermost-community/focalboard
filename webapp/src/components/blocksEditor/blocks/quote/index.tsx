import React, {useRef, useEffect} from 'react'
import {marked} from 'marked'

import {BlockInputProps, ContentType} from '../types'

import './quote.scss'

const Quote: ContentType = {
    name: 'quote',
    displayName: 'Quote',
    slashCommand: '/quote',
    prefix: '> ',
    render: (value: string) => {
        const renderer = new marked.Renderer()
        const html = marked('> '+value, {renderer, breaks: true})
        return <div
            className='Quote'
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
            <blockquote className='Quote'>
                <input
                    ref={ref}
                    onChange={(e) => props.onChange(e.currentTarget.value)}
                    onKeyDown={(e) => {
                        if (props.value === '' && e.key === "Backspace") {
                            props.onCancel()
                        }
                        if (e.key === "Enter") {
                            props.onSave(props.value)
                        }
                    }}
                    onBlur={() => props.onSave(props.value)}
                    value={props.value}
                />
            </blockquote>
        )
    }
}

Quote.runSlashCommand = (changeType: (contentType: ContentType) => void, changeValue: (value: string) => void, ...args: string[]): void => {
    changeType(Quote)
    changeValue(args.join(' '))
}

export default Quote
