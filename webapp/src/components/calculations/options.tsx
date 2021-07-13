// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import Select, {components} from 'react-select'

import {CSSObject} from '@emotion/serialize'

import {getSelectBaseStyle} from '../../theme'
import ChevronUp from '../../widgets/icons/chevronUp'

const options = [
    {
        value: 'count',
        label: 'Count',
    },
    {
        value: 'countValue',
        label: 'Count Value',
    },
    {
        value: 'countUniqueValue',
        label: 'Count Unique Values',
    },
]

const styles = {
    ...getSelectBaseStyle(),
    dropdownIndicator: (provided: CSSObject): CSSObject => ({
        ...provided,
        fontSize: '22px',
    }),
    control: (): CSSObject => ({
        border: 0,
        width: '100%',
        margin: '0',
        display: 'flex',
        flexDirection: 'row',
    }),
    menu: (provided: CSSObject): CSSObject => ({
        ...provided,
        width: '100%',
        background: 'rgb(var(--main-bg))',
    }),
}

const DropdownIndicator = (props: any) => {
    return (
        <components.DropdownIndicator {...props}>
            <ChevronUp/>
        </components.DropdownIndicator>
    )
}

type Props = {
    menuOpen?: boolean
    onClose?: () => undefined
}

const CalculationOptions = (props: Props): JSX.Element => {
    return (
        <Select
            styles={styles}
            value={options[0]}
            isMulti={false}
            isClearable={true}
            name={'calculation_options'}
            className={'CalculationOptions'}
            options={options}
            menuPlacement={'top'}
            isSearchable={false}
            components={{DropdownIndicator}}
            defaultMenuIsOpen={props.menuOpen}
            autoFocus={true}
            onMenuClose={() => {
                if (props.onClose) {
                    props.onClose()
                }
            }}
        />
    )
}

export default CalculationOptions
