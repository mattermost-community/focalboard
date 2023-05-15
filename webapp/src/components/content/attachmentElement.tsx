// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'
import {useIntl} from 'react-intl'

import octoClient from '../../octoClient'

import {AttachmentBlock} from '../../blocks/attachmentBlock'
import {Block, FileInfo} from '../../blocks/block'
import Files from '../../file'
import FileIcons from '../../fileIcons'

import BoardPermissionGate from '../../components/permissions/boardPermissionGate'
import ConfirmationDialogBox, {ConfirmationDialogBoxProps} from '../../components/confirmationDialogBox'
import {Utils} from '../../utils'
import {getUploadPercent} from '../../store/attachments'
import {useAppSelector} from '../../store/hooks'
import {Permission} from '../../constants'

import ArchivedFile from './archivedFile/archivedFile'

import './attachmentElement.scss'
import CompassIcon from './../../widgets/icons/compassIcon'
import MenuWrapper from './../../widgets/menuWrapper'
import IconButton from './../../widgets/buttons/iconButton'
import Menu from './../../widgets/menu'
import Tooltip from './../../widgets/tooltip'

type Props = {
    block: AttachmentBlock
    onDelete?: (block: Block) => void
}

const AttachmentElement = (props: Props): JSX.Element|null => {
    const {block, onDelete} = props
    const [fileInfo, setFileInfo] = useState<FileInfo>({})
    const [fileSize, setFileSize] = useState<string>()
    const [fileIcon, setFileIcon] = useState<string>('file-text-outline-larg')
    const [fileName, setFileName] = useState<string>()
    const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false)
    const uploadPercent = useAppSelector(getUploadPercent(block.id))
    const intl = useIntl()

    useEffect(() => {
        const loadFile = async () => {
            if (block.isUploading) {
                setFileInfo({
                    name: block.title,
                    extension: block.title.split('.').slice(0, -1).join('.'),
                })
                return
            }
            const attachmentInfo = await octoClient.getFileInfo(block.boardId, block.fields.fileId)
            setFileInfo(attachmentInfo)
        }
        loadFile()
    }, [])

    useEffect(() => {
        if (fileInfo.size && !fileSize) {
            setFileSize(Utils.humanFileSize(fileInfo.size))
        }
        if (fileInfo.name && !fileName) {
            const generateFileName = (fName: string) => {
                if (fName.length > 18) {
                    let result = fName.slice(0, 15)
                    result += '...'
                    return result
                }
                return fName
            }
            setFileName(generateFileName(fileInfo.name))
        }
    }, [fileInfo.size, fileInfo.name])

    useEffect(() => {
        if (fileInfo.extension) {
            const getFileIcon = (fileExt: string) => {
                const extType = (Object.keys(Files) as string[]).find((key) => Files[key].find((ext) => ext === fileExt))
                if (extType) {
                    setFileIcon(FileIcons[extType])
                } else {
                    setFileIcon('file-generic-outline-large')
                }
            }
            getFileIcon(fileInfo.extension.substring(1))
        }
    }, [fileInfo.extension])

    const deleteAttachment = () => {
        if (onDelete) {
            onDelete(block)
        }
    }

    const confirmDialogProps: ConfirmationDialogBoxProps = {
        heading: intl.formatMessage({id: 'CardDialog.delete-confirmation-dialog-attachment', defaultMessage: 'Confirm Attachment delete!'}),
        confirmButtonText: intl.formatMessage({id: 'AttachmentElement.delete-confirmation-dialog-button-text', defaultMessage: 'Delete'}),
        onConfirm: deleteAttachment,
        onClose: () => {
            setShowConfirmationDialogBox(false)
        },
    }

    const handleDeleteButtonClick = () => {
        setShowConfirmationDialogBox(true)
    }

    if (fileInfo.archived) {
        return (
            <ArchivedFile fileInfo={fileInfo}/>
        )
    }

    const attachmentDownloadHandler = async () => {
        const attachment = await octoClient.getFileAsDataUrl(block.boardId, block.fields.fileId)
        const anchor = document.createElement('a')
        anchor.href = attachment.url || ''
        anchor.download = fileInfo.name || ''
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
    }

    return (
        <div className='FileElement mr-4'>
            {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps}/>}
            <div className='fileElement-icon-division'>
                <CompassIcon
                    icon={fileIcon}
                    className='fileElement-icon'
                />
            </div>
            <div className='fileElement-file-details mt-3'>
                <Tooltip
                    title={fileInfo.name ? fileInfo.name : ''}
                    placement='bottom'
                >
                    <div className='fileElement-file-name'>
                        {fileName}
                    </div>
                </Tooltip>
                {!block.isUploading && <div className='fileElement-file-ext-and-size'>
                    {fileInfo.extension?.substring(1)} {fileSize}
                </div> }
                {block.isUploading && <div className='fileElement-file-uploading'>
                    {intl.formatMessage({
                        id: 'AttachmentElement.upload-percentage',
                        defaultMessage: 'Uploading...({uploadPercent}%)',
                    }, {
                        uploadPercent,
                    })}
                </div>}
            </div>
            {block.isUploading &&
                <div className='progress'>
                    <span
                        className='progress-bar'
                        style={{width: uploadPercent + '%'}}
                    >
                        {''}
                    </span>
                </div>}
            {!block.isUploading &&
            <div className='fileElement-delete-download'>
                <BoardPermissionGate permissions={[Permission.ManageBoardCards]}>
                    <MenuWrapper className='mt-3 fileElement-menu-icon'>
                        <IconButton
                            size='medium'
                            icon={<CompassIcon icon='dots-vertical'/>}
                        />
                        <div className='delete-menu'>
                            <Menu position='left'>
                                <Menu.Text
                                    id='makeTemplate'
                                    icon={
                                        <CompassIcon
                                            icon='trash-can-outline'
                                        />}
                                    name='Delete'
                                    onClick={handleDeleteButtonClick}
                                />
                            </Menu>
                        </div>
                    </MenuWrapper>
                </BoardPermissionGate>
                <Tooltip
                    title={intl.formatMessage({id: 'AttachmentElement.download', defaultMessage: 'Download'})}
                    placement='bottom'
                >
                    <div
                        className='fileElement-download-btn mt-3 mr-2'
                        onClick={attachmentDownloadHandler}
                    >
                        <CompassIcon
                            icon='download-outline'
                        />
                    </div>
                </Tooltip>
            </div> }
        </div>
    )
}

export default React.memo(AttachmentElement)
