import React, {useState} from 'react'
import * as registry from './blocks/'
import {ContentType} from './blocks/types'
import Select from 'react-select'

type Props = {
    onChange: (value: string) => void
    onChangeType: (blockType: ContentType) => void
    onSave: (value: string, blockType: string) => void
    value: string
}

export default function RootInput(props: Props){
    const [showMenu, setShowMenu] = useState(false)

    return (
        <Select
            components={{ DropdownIndicator:() => null, IndicatorSeparator:() => null }}
            className='RootInput'
            placeholder={"Introduce your text or your slash command"}
            autoFocus={true}
            menuIsOpen={showMenu}
            options={registry.list()}
            getOptionValue={(ct: ContentType) => ct.slashCommand}
            getOptionLabel={(ct: ContentType) => ct.slashCommand + " Creates a new " + ct.displayName + " block."}
            filterOption={(option: any, inputValue: string): boolean => {
                return inputValue.startsWith(option.value) || option.value.startsWith(inputValue)
            }}
            inputValue={props.value}
            onInputChange={(inputValue: string) => {
                props.onChange(inputValue)
                if (inputValue.startsWith('/')) {
                    setShowMenu(true)
                } else {
                    setShowMenu(false)
                }
            }}
            onChange={(ct: ContentType|null) => {
                const [_, ...args] = props.value.split(' ')
                if (ct) {
                    ct.runSlashCommand(props.onChangeType, props.onChange, ...args)
                }
            }}
            onBlur={() => {
                const [command, ..._] = props.value.trimStart().split(' ')
                const block = registry.getBySlashCommandPrefix(command)
                if (command === '' || !block) {
                    props.onSave(props.value, 'text')
                    props.onChange('')
                }
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    const [command, ..._] = props.value.trimStart().split(' ')
                    const block = registry.getBySlashCommandPrefix(command)
                    if (command === '' || !block) {
                        e.preventDefault()
                        e.stopPropagation()
                        props.onSave(props.value, 'text')
                        props.onChange('')
                    }
                }
            }}
        />
    )
}

