// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useRef, useImperativeHandle, forwardRef} from 'react'

import './editable.scss'

type Props = {
    onChange: (value: string) => void
    value?: string
    placeholderText?: string
    className?: string
    saveOnEsc?: boolean
    readonly?: boolean

    validator?: (value: string) => boolean
    onCancel?: () => void
    onSave?: (saveType: 'onEnter'|'onEsc'|'onBlur') => void
}

const Editable = (props: Props, ref: React.Ref<{focus: (selectAll?: boolean) => void}>): JSX.Element => {
    const elementRef = useRef<HTMLInputElement>(null)
    const saveOnBlur = useRef<boolean>(true)

    const save = (saveType: 'onEnter'|'onEsc'|'onBlur'): void => {
        if (props.validator && !props.validator(props.value || '')) {
            return
        }
        if (!props.onSave) {
            return
        }
        if (saveType === 'onBlur' && !saveOnBlur.current) {
            return
        }
        if (saveType === 'onEsc' && !props.saveOnEsc) {
            return
        }
        props.onSave(saveType)
    }

    useImperativeHandle(ref, () => ({
        focus: (selectAll = false): void => {
            if (elementRef.current) {
                const valueLength = elementRef.current.value.length
                elementRef.current.focus()
                if (selectAll) {
                    elementRef.current.setSelectionRange(0, valueLength)
                } else {
                    elementRef.current.setSelectionRange(valueLength, valueLength)
                }
            }
        },
    }))

    const blur = (): void => {
        saveOnBlur.current = false
        elementRef.current?.blur()
        saveOnBlur.current = true
    }

    const {value, onChange, className, placeholderText} = props
    let error = false
    if (props.validator) {
        error = !props.validator(value || '')
    }

    return (
        <input
            ref={elementRef}
            className={'Editable ' + (error ? 'error ' : '') + className}
            placeholder={placeholderText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onChange(e.target.value)
            }}
            value={value}
            title={value}
            onBlur={() => save('onBlur')}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
                if (e.keyCode === 27 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) { // ESC
                    e.stopPropagation()
                    if (props.saveOnEsc) {
                        save('onEsc')
                    } else {
                        props.onCancel?.()
                    }
                    blur()
                } else if (e.keyCode === 13 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) { // Return
                    e.stopPropagation()
                    save('onEnter')
                    blur()
                }
            }}
            readOnly={props.readonly}
        />
    )
}

export default forwardRef(Editable)
