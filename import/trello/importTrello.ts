// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as fs from 'fs'
import minimist from 'minimist'
import {exit} from 'process'
import {ArchiveUtils} from '../util/archive'
import {Block} from '../../webapp/src/blocks/block'
import {Board} from '../../webapp/src/blocks/board'
import {createAttachmentBlock} from '../../webapp/src/blocks/attachmentBlock'
import {createImageBlock} from '../../webapp/src/blocks/imageBlock'
import {createCommentBlock} from '../../webapp/src/blocks/commentBlock'
import {IPropertyOption, IPropertyTemplate, createBoard} from '../../webapp/src/blocks/board'
import {createBoardView} from '../../webapp/src/blocks/boardView'
import {createCard} from '../../webapp/src/blocks/card'
import {createTextBlock} from '../../webapp/src/blocks/textBlock'
import {createCheckboxBlock} from '../../webapp/src/blocks/checkboxBlock'
import {Trello} from './trello'
import {Utils} from './utils'

// HACKHACK: To allow Utils.CreateGuid to work
(global.window as any) = {}

const optionColors = [
    // 'propColorDefault',
    'propColorGray',
    'propColorBrown',
    'propColorOrange',
    'propColorYellow',
    'propColorGreen',
    'propColorBlue',
    'propColorPurple',
    'propColorPink',
    'propColorRed',
]
let optionColorIndex = 0

function main() {
    const args: minimist.ParsedArgs = minimist(process.argv.slice(2))

    const inputFile = args['i']
    const outputFile = args['o'] || 'archive.boardarchive'

    if (!inputFile) {
        showHelp()
    }

    if (!fs.existsSync(inputFile)) {
        console.error(`File not found: ${inputFile}`)
        exit(2)
    }

    // Read input
    const inputData = fs.readFileSync(inputFile, 'utf-8')
    const input = JSON.parse(inputData) as Trello

    // Convert
    const [boards, blocks] = convert(input)

    // Save output
    // TODO: Stream output
    const outputData = ArchiveUtils.buildBlockArchive(boards, blocks)
    fs.writeFileSync(outputFile, outputData)

    console.log(`Exported to ${outputFile}`)
}

function convert(input: Trello): [Board[], Block[]] {
    const boards: Board[] = []
    const blocks: Block[] = []

    // Board
    const board = createBoard()
    console.log(`Board: ${input.name}`)
    board.title = input.name
    board.description = input.desc

    // Convert lists (columns) to a Select property
    const optionIdMap = new Map<string, string>()
    const options: IPropertyOption[] = []
    input.lists.forEach(list => {
        const optionId = Utils.createGuid()
        optionIdMap.set(list.id, optionId)
        const color = optionColors[optionColorIndex % optionColors.length]
        optionColorIndex += 1
        const option: IPropertyOption = {
            id: optionId,
            value: list.name,
            color,
        }
        options.push(option)
    })

    const cardProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'List',
        type: 'select',
        options
    }
    board.cardProperties = [cardProperty]
    boards.push(board)

    // Board view
    const view = createBoardView()
    view.title = 'Board View'
    view.fields.viewType = 'board'
    view.boardId = board.id
    view.parentId = board.id
    blocks.push(view)

    // Cards
    input.cards.forEach(card => {
        console.log(`Card: ${card.name}`)

        const outCard = createCard()
        outCard.title = card.name
        outCard.boardId = board.id
        outCard.parentId = board.id
        const updateDate = new Date(card.dateLastActivity)
        outCard.updateAt = updateDate.getTime()

        // Map lists to Select property options
        if (card.idList) {
            const optionId = optionIdMap.get(card.idList)
            if (optionId) {
                outCard.fields.properties[cardProperty.id] = optionId
            } else {
                console.warn(`Invalid idList: ${card.idList} for card: ${card.name}`)
            }
        } else {
            console.warn(`Missing idList for card: ${card.name}`)
        }

        blocks.push(outCard)

        if (!outCard.fields.contentOrder) {
            outCard.fields.contentOrder = []
        }

        //Description
        if (card.desc) {
            // console.log(`\t${card.desc}`)
            const text = createTextBlock()
            text.title = card.desc
            text.boardId = board.id
            text.parentId = outCard.id
            blocks.push(text)
            outCard.fields.contentOrder.push(text.id)
        }

        // Attachments
        if (card.attachments){
            card.attachments.forEach(attach => {
                const attachment = createAttachmentBlock()
                const extension = getFileExtension(attach.name)
                const name = `${attach.id}.${extension}`
                attachment.fields.fileId = name
                attachment.boardId = board.id
                attachment.parentId = outCard.id
                attachment.title = name

                const date = new Date(attach.date)
                attachment.createAt = date.getTime()
                blocks.push(attachment)

                if (isImageFile(name)){
                    const image = createImageBlock()
                    image.boardId = board.id
                    image.parentId = outCard.id
                    image.fields.fileId = name
                    blocks.push(image)
                    outCard.fields.contentOrder.push(image.id)
                }
            })
        }

        //Iteratin actions to find comments and card createdBy
        input.actions.forEach(action => {
            if (action.data.card && action.data.card.id === card.id) {
                if (action.type === 'createCard') {
                    const date = new Date(action.date)
                    outCard.createAt = date.getTime()
                } else if (action.type === 'commentCard') {
                    const comment = createCommentBlock()
                    comment.boardId = board.id
                    comment.parentId = outCard.id
                    const date = new Date(action.date)
                    comment.createAt = date.getTime()
                    comment.title = action.data.text!
                    blocks.push(comment)
                    outCard.fields.contentOrder.push(comment.id)
                }
            }
        })

        // Add Checklists
        if (card.idChecklists && card.idChecklists.length > 0) {
            card.idChecklists.forEach(checklistID => {
                const lookup = card.checklists.find(e => e.id === checklistID)
                if (lookup) {
                    lookup.checkItems.forEach((trelloCheckBox) => {
                        const checkBlock = createCheckboxBlock()
                        checkBlock.title = trelloCheckBox.name
                        if (trelloCheckBox.state === 'complete') {
                            checkBlock.fields.value = true
                        } else {
                            checkBlock.fields.value = false
                        }
                        checkBlock.boardId = board.id
                        checkBlock.parentId = outCard.id
                        blocks.push(checkBlock)

                        outCard.fields.contentOrder.push(checkBlock.id)
                    })
                }
            })
        }
    })

    console.log(`\nFound ${input.cards.length} card(s).`)

    return [boards, blocks]
}

function isImageFile(filename: string): boolean {
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff', 'svg']
    const extension = filename.split('.').pop()?.toLowerCase()
    return imageExtensions.includes(extension!)
}

function getFileExtension(filename: string): string | null {
    const parts = filename.split('.')
    if (parts.length > 1) {
        return parts[parts.length - 1]
    }

    return null
}

function showHelp() {
    console.log('import -i <input.json> -o [output.boardarchive]')
    exit(1)
}

main()
