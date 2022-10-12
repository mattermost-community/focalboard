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
import {FileInfo} from '../../blocks/block'

import {contentRegistry} from './contentRegistry'
import ArchivedFile from './archivedFile/archivedFile'

import './fileElement.scss'
import CompassIcon from './../../widgets/icons/compassIcon'

type Props = {
    block: ContentBlock
}

const FileElement = (props: Props): JSX.Element|null => {
    const [fileDataUrl, setFileDataUrl] = useState<string|null>(null)
    const [fileInfo, setFileInfo] = useState<FileInfo>({})
    const [fileSize, setFileSize] = useState<string>()
    const [fileIcon, setFileIcon] = useState<string>('file-zip-outline-large')

    const {block} = props

    useEffect(() => {
        if (!fileDataUrl) {
            const loadFile = async () => {
                const fileURL = await octoClient.getFileAsDataUrl(block.boardId, props.block.fields.fileId)
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
            setFileSize(generateFileSize(block.fields.fileSize))
        }
    }, [])

    useEffect(() => {
        const getFileIcon = (fileName: string) => {
            const fileExt = fileName.split('.').pop()
            switch (fileExt) {
            case 'txt':
                setFileIcon('file-text-outline-large')

                break
            case 'pdf':
                setFileIcon('file-pdf-outline-large')
                break
            case 'pptx':
                setFileIcon('file-powerpoint-outline-large')
                break
            default:
                setFileIcon('file-zip-outline-large')
            }
        }
        getFileIcon(block.fields.fileName)
    }, [])

    if (fileInfo.archived) {
        return (
            <ArchivedFile fileInfo={fileInfo}/>
        )
    }

    if (!fileDataUrl) {
        return null
    }

    const fileExtension = block.fields.fileName.split('.').pop()

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
                    {block.fields.fileName}
                </div>
                <div className='fileElement-file-ext-and-size'>
                    {fileExtension} {fileSize}
                </div>
            </div>
            <a
                href={fileDataUrl}
                download={block.fields.fileName}
                target='_blank'
                rel='noopener noreferrer'
                className='fileElement-download-btn'
            >
                <CompassIcon
                    icon='download-outline'
                />
            </a>
        </div>
    )
}

contentRegistry.registerContentType({
    type: 'file',
    getDisplayText: (intl: IntlShape) => intl.formatMessage({id: 'ContentBlock.File', defaultMessage: 'file'}),
    getIcon: () => <ImageIcon/>,
    createBlock: async (boardId: string, intl: IntlShape) => {
        return new Promise<FileBlock>(
            (resolve) => {
                Utils.selectLocalFile(async (file) => {
                    console.log("File", file)
                    const fileId = await octoClient.uploadFile(boardId, file)
                    if (fileId) {
                        const block = createFileBlock()
                        block.fields.fileId = fileId || ''
                        block.fields.fileName = file.name || ''
                        block.fields.fileType = file.type || ''
                        block.fields.fileSize = file.size || ''
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
