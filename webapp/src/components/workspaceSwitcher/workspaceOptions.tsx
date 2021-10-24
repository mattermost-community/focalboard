// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import Select, {OptionProps} from 'react-select'
import {FormattedMessage, useIntl} from 'react-intl'

import {UserWorkspace} from '../../user'
import {useAppSelector} from '../../store/hooks'

import './workspaceOptions.scss'
import Search from '../../widgets/icons/search'
import {getUserWorkspaceList} from '../../store/workspace'

type Props = {
    onBlur?: () => void
    onChange: (value: string) => void
    activeWorkspaceId: string
}

export const DashboardOption = {
    label: 'Dashboard',
    value: 'dashboard',
    boardCount: 0,
}

const WorkspaceOptions = (props: Props): JSX.Element => {
    const intl = useIntl()
    const userWorkspaces = useAppSelector<UserWorkspace[]>(getUserWorkspaceList)
    let options = userWorkspaces.
        filter((workspace) => workspace.id !== props.activeWorkspaceId).
        map((workspace) => {
            return {
                label: workspace.title,
                value: workspace.id,
                boardCount: workspace.boardCount,
            }
        }).
        sort((a, b) => {
            // This will arrange into two groups -
            // on the top we'll have workspaces with boards
            // and below that we'll have onces with no boards,
            // and each group will be sorted alphabetically within itself.
            if ((a.boardCount === 0 && b.boardCount === 0) || (a.boardCount !== 0 && b.boardCount !== 0)) {
                return a.label.localeCompare(b.label)
            }

            return b.boardCount - a.boardCount
        })

    options = [DashboardOption, ...options]

    return (
        <Select
            className='WorkspaceOptions'
            classNamePrefix='WorkspaceOptions'
            autoFocus={true}
            backspaceRemovesValue={false}
            controlShouldRenderValue={false}
            hideSelectedOptions={false}
            isClearable={false}
            placeholder={'Search...'}
            tabSelectsValue={false}
            options={options}
            menuIsOpen={true}
            noOptionsMessage={() => intl.formatMessage({
                id: 'Sidebar.no-more-workspaces',
                defaultMessage: 'No more workspaces',
            })}
            onBlur={() => {
                if (props.onBlur) {
                    props.onBlur()
                }
            }}
            components={{
                DropdownIndicator: Search,
                IndicatorSeparator: null,
                Option,
            }}
            onChange={(item) => {
                if (item?.value) {
                    props.onChange(item.value)
                }
            }}
        />
    )
}

const Option = (props: OptionProps<typeof DashboardOption, false>): JSX.Element => {
    const {innerProps, innerRef} = props

    return (
        <div
            ref={innerRef}
            {...innerProps}
            className={`Option ${props.isFocused ? 'focused' : ''}`}
        >
            <div className='workspaceTitle'>
                {props.data.label}
            </div>

            {
                props.data.value !== DashboardOption.value &&
                <div className='boardCount'>
                    <FormattedMessage
                        values={{count: props.data.boardCount}}
                        id='General.BoardCount'
                        defaultMessage='{count, plural, one {# Board} other {# Boards}}'
                    />
                </div>
            }

        </div>
    )
}

export default WorkspaceOptions
