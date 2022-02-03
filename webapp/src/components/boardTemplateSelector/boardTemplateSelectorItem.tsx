// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useState} from 'react'
import {useIntl} from 'react-intl'

import {Board} from '../../blocks/board'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import EditIcon from '../../widgets/icons/edit'
import DeleteBoardDialog from '../sidebar/deleteBoardDialog'

import './boardTemplateSelectorItem.scss'

type Props = {
    isActive: boolean
    template: Board
    onSelect: (template: Board) => void
    onDelete: (template: Board) => void
    onEdit: (templateId: string) => void
}

const BoardTemplateSelectorItem = React.memo((props: Props) => {
    const {isActive, template, onEdit, onDelete, onSelect} = props
    const intl = useIntl()
    const [deleteOpen, setDeleteOpen] = useState<boolean>(false)
    const onClickHandler = useCallback(() => {
        onSelect(template)
    }, [onSelect, template])
    const onEditHandler = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onEdit(template.id)
    }, [onEdit, template])

    return (
        <div
            className={isActive ? 'BoardTemplateSelectorItem active' : 'BoardTemplateSelectorItem'}
            onClick={onClickHandler}
        >
            <span className='template-icon'>{template.fields.icon}</span>
            <span className='template-name'>{template.title}</span>
            {template.workspaceId !== '0' &&
                <div className='actions'>
                    <IconButton
                        icon={<DeleteIcon/>}
                        title={intl.formatMessage({id: 'BoardTemplateSelector.delete-template', defaultMessage: 'Delete'})}
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            setDeleteOpen(true)
                        }}
                    />
                    <IconButton
                        icon={<EditIcon/>}
                        title={intl.formatMessage({id: 'BoardTemplateSelector.edit-template', defaultMessage: 'Edit'})}
                        onClick={onEditHandler}
                    />
                </div>}
            {deleteOpen &&
            <DeleteBoardDialog
                boardTitle={template.title}
                onClose={() => setDeleteOpen(false)}
                isTemplate={true}
                onDelete={async () => {
                    onDelete(template)
                }}
            />}
        </div>
    )
})

export default BoardTemplateSelectorItem
