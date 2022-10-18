// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'
import {IntlShape} from 'react-intl'

import {FileBlock, createFileBlock} from '../../blocks/fileBlock'
import octoClient from '../../octoClient'
import {Utils} from '../../utils'
import ImageIcon from '../../widgets/icons/image'
import {sendFlashMessage} from '../../components/flashMessages'

import {ContentBlock} from '../../blocks/contentBlock'
import {Block, FileInfo} from '../../blocks/block'
import Files from '../../file'

import {contentRegistry} from './contentRegistry'
import ArchivedFile from './archivedFile/archivedFile'

import './fileElement.scss'
import CompassIcon from './../../widgets/icons/compassIcon'
import MenuWrapper from './../../widgets/menuWrapper'
import IconButton from './../../widgets/buttons/iconButton'
import Menu from './../../widgets/menu'

type Props = {
    block: ContentBlock
    onDelete?: (block: Block) => void
}

const FileElement = (props: Props): JSX.Element|null => {
    const {block, onDelete} = props
    const [fileDataUrl, setFileDataUrl] = useState<string|null>(null)
    const [fileInfo, setFileInfo] = useState<FileInfo>({})
    const [fileSize, setFileSize] = useState<string>()
    const [fileIcon, setFileIcon] = useState<string>('file-zip-outline-large')
    const [fileName, setFileName] = useState<string>()

    useEffect(() => {
        if (!fileDataUrl) {
            const loadFile = async () => {
                const fileURL = await octoClient.getFileAsDataUrl(block.boardId, block.fields.attachmentId)
                setFileDataUrl(fileURL.url || '')
                setFileInfo(fileURL)
            }
            loadFile()
        }
    }, [])

    useEffect(() => {
        if (!fileSize) {
            const generateFileSize = (bytes: string, decimals = 2) => {
                if (!Number(bytes)) {
                    return '0 Bytes'
                }
                const k = 1024
                const dm = decimals < 0 ? 0 : decimals
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
                const i = Math.floor(Math.log(Number(bytes)) / Math.log(k))
                return `${parseFloat((Number(bytes) / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
            }
            setFileSize(generateFileSize(block.fields.attachmentSize))
        }
        if (!fileName) {
            const generateFileName = (fName: string) => {
                if (fName.length > 21) {
                    let result = fName.slice(0, 18)
                    result += '...'
                    return result
                }
                return fName
            }
            setFileName(generateFileName(block.fields.attachmentName))
        }
    }, [])

    useEffect(() => {
        const getFileIcon = (fName: string) => {
            const fileExt = fName.split('.').pop()
            const extType = (Object.keys(Files) as string[]).find((key) => Files[key].find((ext) => ext === fileExt))
            switch (extType) {
            case 'AUDIO_TYPES':
                setFileIcon('file-audio-outline')
                break
            case 'CODE_TYPES':
                setFileIcon('file-code-outline-large')
                break
            case 'IMAGE_TYPES':
                setFileIcon('file-image-outline-large')
                break
            case 'PDF_TYPES':
                setFileIcon('file-pdf-outline-large')
                break
            case 'PATCH_TYPES':
                setFileIcon('file-patch-outline-large')
                break
            case 'PRESENTATION_TYPES':
                setFileIcon('file-powerpoint-outline-large')
                break
            case 'SPREADSHEET_TYPES':
                setFileIcon('file-excel-outline-large')
                break
            case 'TEXT_TYPES':
                setFileIcon('file-text-outline-large')
                break
            case 'VIDEO_TYPES':
                setFileIcon('file-video-outline-large')
                break
            case 'WORD_TYPES':
                setFileIcon('file-word-outline-large')
                break
            default:
                setFileIcon('file-zip-outline-large')
            }
        }
        getFileIcon(block.fields.attachmentName)
    }, [])

    const deleteAttachment = () => {
        if (onDelete) {
            onDelete(block)
        }
    }

    if (fileInfo.archived) {
        return (
            <ArchivedFile fileInfo={fileInfo}/>
        )
    }

    if (!fileDataUrl) {
        return null
    }

    const fileExtension = block.fields.attachmentName.split('.').pop()

    return (
        <div className='FileElement mr-4'>
            <div className='fileElement-icon-division'>
                <CompassIcon
                    icon={fileIcon}
                    className='fileElement-icon'
                />
            </div>
            <div className='fileElement-file-details mt-3'>
                <div className='fileElement-file-name'>
                    {fileName}
                </div>
                <div className='fileElement-file-ext-and-size'>
                    {fileExtension} {fileSize}
                </div>
            </div>
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
                            onClick={deleteAttachment}
                        />
                    </Menu>
                </div>
            </MenuWrapper>
            <a
                href={fileDataUrl}
                download={block.fields.attachmentName}
                target='_blank'
                rel='noopener noreferrer'
                className='fileElement-download-btn mt-5 mr-2'
            >
                <CompassIcon
                    icon='download-outline'
                />
            </a>
        </div>
    )
}

contentRegistry.registerContentType({
    type: 'attachment',
    getDisplayText: (intl: IntlShape) => intl.formatMessage({id: 'ContentBlock.File', defaultMessage: 'file'}),
    getIcon: () => <ImageIcon/>,
    createBlock: async (boardId: string, intl: IntlShape) => {
        return new Promise<FileBlock>(
            (resolve) => {
                Utils.selectLocalFile(async (attachment) => {
                    const attachmentId = await octoClient.uploadFile(boardId, attachment)
                    if (attachmentId) {
                        const block = createFileBlock()
                        block.fields.attachmentId = attachmentId || ''
                        block.fields.attachmentName = attachment.name || ''
                        block.fields.attachmentType = attachment.type || ''
                        block.fields.attachmentSize = attachment.size || 0
                        block.fields.isAttachment = true
                        resolve(block)
                    } else {
                        sendFlashMessage({content: intl.formatMessage({id: 'createFileBlock.failed', defaultMessage: 'Unable to upload the file. File size limit reached.'}), severity: 'normal'})
                    }
                },
                '')
            },
        )

        // return new FileBlock()
    },
    createComponent: (block) => <FileElement block={block}/>,
})

export default React.memo(FileElement)
