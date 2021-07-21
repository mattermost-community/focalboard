// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {forwardRef, useImperativeHandle, useRef} from 'react'

import './editableArea.scss'

type Props = {
    onChange: (value: string) => void
    value?: string
    placeholderText?: string
    className?: string
    saveOnEsc?: boolean
    readonly?: boolean
    spellCheck?: boolean

    validator?: (value: string) => boolean
    onCancel?: () => void
    onSave?: (saveType: 'onEnter' | 'onEsc' | 'onBlur') => void
}

const EditableArea = (props: Props, ref: React.Ref<{ focus: (selectAll?: boolean) => void }>): JSX.Element => {
    const elementRef = useRef<HTMLTextAreaElement>(null)
    const saveOnBlur = useRef<boolean>(true)

    const save = (saveType: 'onEnter' | 'onEsc' | 'onBlur'): void => {
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

    const {value, onChange, className, placeholderText, readonly} = props
    let error = false
    if (props.validator) {
        error = !props.validator(value || '')
    }

    return (
        <div
            className={'grow-wrap ' + className}
            data-replicated-value={value}
        >
            <textarea
                ref={elementRef}
                className={'EditableArea ' + (error ? 'error ' : '') + (readonly ? 'readonly ' : '')}
                placeholder={placeholderText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    onChange(e.target.value)
                }}
                value={value}
                title={value}
                rows={1}
                onBlur={() => save('onBlur')}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
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
                readOnly={readonly}
                spellCheck={props.spellCheck}
            />
        </div>
    )
}

export default forwardRef(EditableArea)
