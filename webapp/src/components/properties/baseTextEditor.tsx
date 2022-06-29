// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useState, useRef, useEffect} from 'react'

import {useIntl} from 'react-intl'

import mutator from '../../mutator'
import {OctoUtils} from '../../octoUtils'
import Editable from '../../widgets/editable'

import {propertyValueClassName} from '../propertyValueUtils'
import {PropertyProps} from './index'

const BaseTextEditor = (props: PropertyProps & {validator: () => boolean, spellCheck?: boolean}): JSX.Element => {
    if(!props.propertyTemplate) {
        return <></>;
    }

    const [value, setValue] = useState(props.card.fields.properties[props.propertyTemplate.id || ''] || '')
    const onCancel = useCallback(() => setValue(props.value || ''), [props.value])

    const saveTextProperty = useCallback(() => {
        if (value !== (props.card.fields.properties[props.propertyTemplate?.id || ''] || '')) {
            mutator.changePropertyValue(props.board.id, props.card, props.propertyTemplate?.id || '', value)
        }
    }, [props.card, props.propertyTemplate, value])

    const saveTextPropertyRef = useRef<() => void>(saveTextProperty)
    saveTextPropertyRef.current = saveTextProperty

    const intl = useIntl()
    const displayValue = OctoUtils.propertyDisplayValue(props.card, props.value, props.propertyTemplate, intl)
    const emptyDisplayValue = props.showEmptyPlaceholder ? intl.formatMessage({id: 'PropertyValueElement.empty', defaultMessage: 'Empty'}) : ''

    useEffect(() => {
        return () => {
            saveTextPropertyRef.current && saveTextPropertyRef.current()
        }
    }, [])

    if (!props.readOnly) {
        return (
            <Editable
                className={propertyValueClassName()}
                placeholderText={emptyDisplayValue}
                value={value.toString()}
                autoExpand={true}
                onChange={setValue}
                onSave={saveTextProperty}
                onCancel={onCancel}
                validator={props.validator}
                spellCheck={props.spellCheck}
            />
        )
    }
    return <div className={propertyValueClassName({readonly: true})}>{displayValue}</div>
}

export default BaseTextEditor
