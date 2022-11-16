// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'
import {useIntl} from 'react-intl'

import octoClient from '../../octoClient'

import {AttachmentBlock} from '../../blocks/attachmentBlock'
import {Block, FileInfo} from '../../blocks/block'
import Files from '../../file'
import FileIcons from '../../fileIcons'

import ConfirmationDialogBox, {ConfirmationDialogBoxProps} from '../../components/confirmationDialogBox'
import {Utils} from '../../utils'

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
    const [fileDataUrl, setFileDataUrl] = useState<string|null>(null)
    const [fileInfo, setFileInfo] = useState<FileInfo>({})
    const [fileSize, setFileSize] = useState<string>()
    const [fileIcon, setFileIcon] = useState<string>('file-text-outline-larg')
    const [fileName, setFileName] = useState<string>()
    const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false)

    const intl = useIntl()

    useEffect(() => {
        if (!fileDataUrl) {
            const loadFile = async () => {
                if (block.isUploading) {
                    setFileInfo({
                        name: block.title,
                        extension: block.title.split('.').slice(0, -1).join('.'),
                    })
                    setFileDataUrl(block.title)
                    return
                }
                const attachment = await octoClient.getFileAsDataUrl(block.boardId, block.fields.attachmentId)
                setFileDataUrl(attachment.url || '')
                const attachmentInfo = await octoClient.getFileInfo(block.boardId, block.fields.attachmentId)
                setFileInfo(attachmentInfo)
            }
            loadFile()
        }
    }, [])

    useEffect(() => {
        if (fileInfo.size && !fileSize) {
            setFileSize(Utils.humanFileSize(fileInfo.size))
        }
        if (fileInfo.name && !fileName) {
            const generateFileName = (fName: string) => {
                if (fName.length > 21) {
                    let result = fName.slice(0, 18)
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
        confirmButtonText: intl.formatMessage({id: 'CardDialog.delete-confirmation-dialog-button-text', defaultMessage: 'Delete'}),
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

    if (!fileDataUrl) {
        return null
    }

    return (
        <div className='FileElement mr-4'>
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
                    {'Uploading...'}
                </div>}
            </div>
            {!block.isUploading &&
            <div className='fileElement-delete-download'>
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
                <Tooltip
                    title='Download'
                    placement='bottom'
                >
                    <a
                        href={fileDataUrl}
                        download={fileInfo.name}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='fileElement-download-btn mt-5 mr-2'
                    >
                        <CompassIcon
                            icon='download-outline'
                        />
                    </a>
                </Tooltip>
            </div> }
            {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps}/>}
        </div>
    )
}

export default React.memo(AttachmentElement)
