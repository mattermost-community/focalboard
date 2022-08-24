import React, {useState, useEffect} from 'react'

import * as contentBlocks from './blocks/'
import {ContentType} from './blocks/types'
import {ContentBlockTypes} from '../../blocks/block'
import RootInput from './rootInput'

import './editor.scss'

type Props = {
    onSave: (value: string, contentType: ContentBlockTypes) => void
    initialValue?: string
    initialContentType?: string
}

export default function Editor(props: Props) {
    const [value, setValue] = useState(props.initialValue || '')
    const [currentBlockType, setCurrentBlockType] = useState<ContentType|null>(contentBlocks.get(props.initialContentType || '') || null)

    useEffect(() => {
        if (!currentBlockType) {
            const block = contentBlocks.getByPrefix(value)
            if (block) {
                setValue('')
                setCurrentBlockType(block)
            } else if (value !== '' && !contentBlocks.isSubPrefix(value) && !value.startsWith('/')) {
                setCurrentBlockType(contentBlocks.get('text'))
            }
        }
    }, [value, currentBlockType])

    const CurrentBlockInput = currentBlockType?.Input

    return (
        <div className='Editor'>
            {currentBlockType === null &&
                <RootInput
                    onChange={setValue}
                    onChangeType={setCurrentBlockType}
                    value={value}
                    onSave={(val: string, blockType: ContentBlockTypes) => {
                        props.onSave(val, blockType)
                        setValue('')
                        setCurrentBlockType(null)
                    }}
                />}
            {CurrentBlockInput &&
                <CurrentBlockInput
                    onChange={setValue}
                    value={value}
                    onCancel={() => {
                        setValue('')
                        setCurrentBlockType(null)
                    }}
                    onSave={(val: string) => {
                        props.onSave(val, currentBlockType.name)
                        const nextType = contentBlocks.get(currentBlockType.nextType || '')
                        setValue('')
                        setCurrentBlockType(nextType || null)
                    }}
                />}
        </div>
    )
}
