// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useRef, useEffect} from 'react'

type TextInputOptionProps = {
    initialValue: string,
    onValueChanged: (value: string) => void
}

function TextInputOption(props: TextInputOptionProps): JSX.Element {
    const nameTextbox = useRef<HTMLInputElement>(null)
    const [value, setValue] = useState(props.initialValue)

    useEffect(() => {
        nameTextbox.current?.focus()
        nameTextbox.current?.setSelectionRange(0, value.length)
    }, [])

    return (
        <input
            ref={nameTextbox}
            type='text'
            className='PropertyMenu menu-textbox menu-option'
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setValue(e.target.value)}
            value={value}
            title={value}
            onBlur={() => props.onValueChanged(value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    props.onValueChanged(value)
                    e.stopPropagation()
                    if (e.key === 'Enter') {
                        e.target.dispatchEvent(new Event('menuItemClicked'))
                    }
                }
            }}
            spellCheck={true}
        />)
}

export default React.memo(TextInputOption)
