// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, forwardRef} from 'react'

type TextInputOptionProps = {
    initialValue: string,
    onValueChanged: (value: string) => void
}

function TextInputOption(props: TextInputOptionProps, ref: React.Ref<HTMLInputElement>): JSX.Element {
    const [value, setValue] = useState(props.initialValue)

    return (
        <input
            ref={ref}
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

export default forwardRef(TextInputOption)
