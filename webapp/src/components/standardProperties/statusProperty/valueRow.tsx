// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useRef, useState} from 'react'
import {Draggable} from 'react-beautiful-dnd'

import DeleteIcon from '../../../widgets/icons/delete'

import {Constants} from '../../../constants'

import DragHandle from '../../../widgets/icons/dragHandle'
import EditIcon from '../../../widgets/icons/edit'
import Menu from '../../../widgets/menu/menu'
import MenuWrapper from '../../../widgets/menuWrapper'

import {IPropertyOption} from '../../../blocks/board'

import OptionsIcon from '../../../widgets/icons/options'

import EditableLabel from './editableLabel/editableLabel'

type Props = {
    option: IPropertyOption
    index: number
    editing: boolean
    onUpdate: (statusCategoryID: string, newOptionValue: IPropertyOption) => void
    onDelete: (statusCategoryID: string, optionID: string) => void
    valueCategoryID: string
}

const ValueRow = (props: Props) => {
    const colorEditorRef = useRef(null)
    const menuRef = useRef(null)
    const [isActive, setIsActive] = useState<boolean>(false)
    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [menuOpen, setMenuOpen] = useState<boolean>(false)

    const handleOnColorChange = useCallback((newColor: string) => {
        const newValue: IPropertyOption = {
            ...props.option,
            color: newColor,
        }

        props.onUpdate(props.valueCategoryID, newValue)
    }, [props.valueCategoryID, props.option.value, props.option.color])

    const handleEditButtonClick = useCallback(() => {
        setIsEditing((value) => !value)
    }, [])

    const handleDeleteButtonClick = useCallback(() => {
        props.onDelete(props.valueCategoryID, props.option.id)
    }, [props.valueCategoryID, props.option.id])

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
                    className={`categorySwimlane_Value ${isActive || props.editing || isEditing || menuOpen ? 'active' : ''}`}
                    onBlur={() => {
                        setIsActive(false)
                        setIsEditing(false)
                    }}
                >
                    <div
                        {...draggableProvided.dragHandleProps}
                        className='dragHandleWrapper'
                    >
                        <DragHandle/>
                    </div>

                    <EditableLabel
                        option={props.option}
                        editing={props.editing || isEditing}
                        onBlur={(newOptionValue: IPropertyOption) => props.onUpdate(props.valueCategoryID, newOptionValue)}
                    />
                    <MenuWrapper
                        stopPropagationOnToggle={true}
                        onToggle={(isOpen: boolean) => setIsActive(isOpen)}
                    >
                        <div
                            ref={colorEditorRef}
                            className={`colorEditor ${props.option.color} ${props.editing ? 'editing' : ''}`}
                        />
                        <Menu
                            position='auto'
                            parentRef={colorEditorRef}
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
                                            onClick={() => handleOnColorChange(key)}
                                        />
                                    ),
                                )
                            }
                        </Menu>
                    </MenuWrapper>
                    <MenuWrapper
                        stopPropagationOnToggle={true}
                        onToggle={(open) => setMenuOpen(open)}
                    >
                        <div
                            ref={menuRef}
                            className='contextMenu'
                        >
                            <OptionsIcon/>
                        </div>
                        <Menu
                            position='auto'
                            parentRef={menuRef}
                            menuMargin={30}
                            fixed={true}
                        >
                            <Menu.Text
                                id='editText'
                                name={'Edit'}
                                icon={<EditIcon/>}
                                onClick={handleEditButtonClick}
                            />
                            <Menu.Text
                                id='deleteOption'
                                name={'Delete'}
                                icon={<DeleteIcon/>}
                                onClick={handleDeleteButtonClick}
                                className='text-danger'
                            />
                        </Menu>
                    </MenuWrapper>
                </div>
            )}
        </Draggable>
    )
}

export default React.memo(ValueRow)
