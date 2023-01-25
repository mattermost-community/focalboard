// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useRef, useState} from 'react'
import {Draggable} from 'react-beautiful-dnd'

import {Constants} from '../../../constants'

import DragHandle from '../../../widgets/icons/dragHandle'
import EditIcon from '../../../widgets/icons/edit'
import Menu from '../../../widgets/menu/menu'
import MenuWrapper from '../../../widgets/menuWrapper'

import {IPropertyOption} from '../../../blocks/board'

import EditableLabel from './editableLabel/editableLabel'
import {EditablePropertyOption} from './editStatusDialog'

type Props = {
    option: EditablePropertyOption
    index: number
    editing: boolean
    handleAddNewValue: (statusCategoryID: string, newOptionValue: IPropertyOption) => void
    valueCategoryID: string
}

const ValueRow = (props: Props) => {
    const ref = useRef(null)
    const [isActive, setIsActive] = useState<boolean>()

    return (
        <Draggable
            draggableId={props.option.id}
            index={props.index}
            key={props.option.id}
        >
            {(draggableProvided) => (
                <div
                    {...draggableProvided.draggableProps}
                    ref={draggableProvided.innerRef}
                    key={props.option.id}
                    className={`categorySwimlane_Value ${isActive || props.editing ? 'active' : ''}`}
                >
                    <div
                        {...draggableProvided.dragHandleProps}
                        className='dragHandleWrapper'
                    >
                        <DragHandle/>
                    </div>

                    <EditableLabel
                        option={props.option}
                        editing={props.editing}
                        onBlur={(newOptionValue: IPropertyOption) => props.handleAddNewValue(props.valueCategoryID, newOptionValue)}
                    />
                    <MenuWrapper
                        stopPropagationOnToggle={true}
                        onToggle={(isOpen: boolean) => setIsActive(isOpen)}
                    >
                        <div
                            ref={ref}
                            className={`colorEditor ${props.option.color} ${props.editing ? 'editing' : ''}`}
                        />
                        <Menu
                            position='auto'
                            parentRef={ref}
                            menuMargin={30}
                            fixed={true}
                        >
                            {
                                Object.entries(Constants.menuColors).map(
                                    ([key, color]: [string, string]) => (
                                        <Menu.Color
                                            key={key}
                                            id={key}
                                            name={color}
                                            onClick={() => {}}
                                        />
                                    ),
                                )
                            }
                        </Menu>
                    </MenuWrapper>
                    <EditIcon/>
                </div>
            )}
        </Draggable>
    )
}

export default React.memo(ValueRow)
