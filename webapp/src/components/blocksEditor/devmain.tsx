// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import ReactDOM from 'react-dom'

import {BlockData} from './blocks/types'
import BlocksEditor from './blocksEditor'
import {register} from './blocks/'
import TextDev from './blocks/text-dev'

import '@mattermost/compass-icons/css/compass-icons.css'

import '../../styles/variables.scss'
import '../../styles/main.scss'
import '../../styles/labels.scss'
import '../../styles/_markdown.scss'

import './devmain.scss'

const newID = () => Math.random().toString(36).slice(2)

register(TextDev)

const fakeData = [
    {id: '1', value: 'Title', contentType: 'h1'},
    {id: '2', value: 'Sub title', contentType: 'h2'},
    {id: '3', value: 'Sub sub title', contentType: 'h3'},
    {id: '4', value: 'Some **markdown** text', contentType: 'text'},
    {id: '5', value: 'Some multiline\n**markdown** text\n### With Items\n- Item 1\n- Item2\n- Item3', contentType: 'text'},
    {id: '6', value: {checked: true, value: 'Checkbox'}, contentType: 'checkbox'},
]

function App() {
    //const [data, setData] = useState<BlockData[]>([])
    const [data, setData] = useState<Array<BlockData<any>>>(fakeData)

    return (
        <div className='App'>
            <header className='App-header'>
                <BlocksEditor
                    readonly={false}
                    blocks={data}
                    onBlockCreated={async (block: BlockData<any>, afterBlock?: BlockData<any>): Promise<BlockData|null> => {
                        if (block.contentType === 'text' && block.value === '') {
                            return null
                        }
                        const id = newID()
                        let newData: BlockData[] = []
                        const newBlock = {value: block.value, contentType: block.contentType, id}

                        if (block.contentType === 'image' && (typeof block.value.file !== 'string')) {
                            const base64String = btoa(String.fromCharCode.apply(null, (new Uint8Array(block.value.file)) as unknown as number[]))
                            newBlock.value.file = `data:image/jpeg;base64,${base64String}`
                        }

                        if (afterBlock) {
                            for (const b of data) {
                                newData.push(b)
                                if (b.id === afterBlock.id) {
                                    newData.push(newBlock)
                                }
                            }
                        } else {
                            newData = [...data, newBlock]
                        }
                        setData(newData)
                        return newBlock
                    }}
                    onBlockModified={async (block: BlockData): Promise<BlockData|null> => {
                        const newData: BlockData[] = []
                        if (block.contentType === 'text' && block.value === '') {
                            for (const b of data) {
                                if (b.id !== block.id) {
                                    newData.push(b)
                                }
                            }
                            setData(newData)
                            return block
                        }
                        for (const b of data) {
                            if (b.id === block.id) {
                                newData.push(block)
                            } else {
                                newData.push(b)
                            }
                        }
                        setData(newData)
                        return block
                    }}
                    onBlockMoved={async (block: BlockData<any>, beforeBlock: BlockData|null, afterBlock: BlockData<any>|null): Promise<void> => {
                        const newData: BlockData[] = []
                        for (const b of data) {
                            if (b.id !== block.id) {
                                if (beforeBlock && b.id === beforeBlock.id) {
                                    newData.push(block)
                                }
                                newData.push(b)
                                if (afterBlock && b.id === afterBlock.id) {
                                    newData.push(block)
                                }
                            }
                        }
                        setData(newData)
                    }}
                />
            </header>
        </div>
    )
}

ReactDOM.render(<App/>, document.getElementById('focalboard-app'))
