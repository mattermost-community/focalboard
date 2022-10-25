// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as fs from 'fs'
import minimist from 'minimist'
import {exit} from 'process'
import {ArchiveUtils} from '../util/archive'
import {Block} from '../../webapp/src/blocks/block'
import {Board as FBBoard} from '../../webapp/src/blocks/board'
import {IPropertyOption, IPropertyTemplate, createBoard} from '../../webapp/src/blocks/board'
import {createBoardView} from '../../webapp/src/blocks/boardView'
import {createCard} from '../../webapp/src/blocks/card'
import {createTextBlock} from '../../webapp/src/blocks/textBlock'
import {NextcloudDeckClient, Stack, Board} from './deck'
import {Utils} from './utils'
import readline from 'readline-sync'
import {createCommentBlock} from '../../webapp/src/blocks/commentBlock'


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

async function main() {
    const args: minimist.ParsedArgs = minimist(process.argv.slice(2))

    console.log("Transform a nextcloud deck into a mattermost Board.")

    if (args['h'] || args['help']) {
        showHelp()
    }

    // Get Options
    const url = args['url'] ?? readline.question('Nextcloud URL: ')
    const username = args['u'] ?? readline.question('Username: ')
    const password = args['p'] ?? readline.question('Password: ', {hideEchoBack: true})
    const boardIdString = args['b']

    const outputFile = args['o'] || 'archive.boardarchive'

    // Create Client
    const deckClient = new NextcloudDeckClient({auth: {username, password}, url})

    // Select board (Either from cli or by interactive selection)
    const boardId = boardIdString ? parseInt(boardIdString) : await selectBoard(deckClient)

    // Get Data
    const board = await deckClient.getBoardDetails(boardId)
    const stacks = await Promise.all((await deckClient.getStacks(boardId)).map(async s => {
        return {
            ...s,
            cards: await Promise.all(s.cards.map(async c => {
                if (c.commentsCount > 0) {
                    c.comments = await deckClient.getComments(c.id)
                }
                return c
            }))
        }
    }))

    // Convert
    const [boards, blocks] = convert(board, stacks)

    // // Save output
    const outputData = ArchiveUtils.buildBlockArchive(boards, blocks)
    fs.writeFileSync(outputFile, outputData)

    console.log(`Exported to ${outputFile}`)
}

async function selectBoard(deckClient: NextcloudDeckClient): Promise<number> {
    console.log("\nAvailable boards for this user:")
    const boards = await deckClient.getBoards()
    boards.forEach(b => console.log(`\t${b.id}: ${b.title} (${b.owner.uid})`))
    return readline.questionInt("Enter Board ID: ")
}

function convert(deckBoard: Board, stacks: Stack[]): [FBBoard[], Block[]] {
    const boards: FBBoard[] = []
    const blocks: Block[] = []

    // Board
    const board = createBoard()
    console.log(`Board: ${deckBoard.title}`)
    board.title = deckBoard.title

    let colorIndex = 0
    // Convert stacks (columns) to a Select property
    const stackOptionsIdMap = new Map<number, string>()
    const stackOptions: IPropertyOption[] = []
    stacks.forEach(stack => {
        const optionId = Utils.createGuid()
        stackOptionsIdMap.set(stack.id, optionId)
        const color = optionColors[colorIndex % optionColors.length]
        colorIndex += 1
        const option: IPropertyOption = {
            id: optionId,
            value: stack.title,
            color,
        }
        stackOptions.push(option)
    })
    const stackProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'List',
        type: 'select',
        options: stackOptions
    }

    // Convert labels (tags) to a Select property
    const labelOptionsIdMap = new Map<number, string>()
    const labelOptions: IPropertyOption[] = []
    deckBoard.labels.forEach(label => {
        const optionId = Utils.createGuid()
        labelOptionsIdMap.set(label.id, optionId)
        const color = optionColors[colorIndex % optionColors.length]
        colorIndex += 1
        const option: IPropertyOption = {
            id: optionId,
            value: label.title,
            color,
        }
        labelOptions.push(option)
    })
    const labelProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'Label',
        type: 'multiSelect',
        options: labelOptions
    }
    const dueDateProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'Due Date',
        type: 'date',
        options: []
    }

    board.cardProperties = [stackProperty, labelProperty, dueDateProperty]
    boards.push(board)

    // Board view
    const view = createBoardView()
    view.title = 'Board View'
    view.fields.viewType = 'board'
    view.boardId = board.id
    view.parentId = board.id
    blocks.push(view)

    // Cards
    stacks.forEach(stack =>
        stack.cards.forEach(
            card => {
                console.log(`Card: ${card.title}`)

                const outCard = createCard()
                outCard.title = card.title
                outCard.boardId = board.id
                outCard.parentId = board.id

                // Map Stacks to Select property options
                const stackOptionId = stackOptionsIdMap.get(card.stackId)
                if (stackOptionId) {
                    outCard.fields.properties[stackProperty.id] = stackOptionId
                } else {
                    console.warn(`Invalid idList: ${card.stackId} for card: ${card.title}`)
                }
                // Map Labels to Multiselect options
                outCard.fields.properties[labelProperty.id] = card.labels?.map(label => labelOptionsIdMap.get(label.id)).filter((id): id is string => !!id)

                // Add duedate
                if (card.duedate) {
                    const duedate = new Date(card.duedate)
                    outCard.fields.properties[dueDateProperty.id] = `{\"from\":${duedate.getTime()}}`
                }

                blocks.push(outCard)

                // Description
                if (card.description) {
                    const text = createTextBlock()
                    text.title = card.description
                    text.boardId = board.id
                    text.parentId = outCard.id
                    blocks.push(text)

                    outCard.fields.contentOrder = [text.id]
                }

                // Add Comments (Author cannot be determined since uid's are different)
                card.comments?.forEach(comment => {
                    const commentBlock = createCommentBlock()
                    commentBlock.title = comment.message
                    commentBlock.boardId = board.id
                    commentBlock.parentId = outCard.id
                    blocks.push(commentBlock)
                })

            })
    )
    console.log('')
    console.log(`Transformed Board ${deckBoard.title} into ${blocks.length} blocks.`)

    return [boards, blocks]
}

function showHelp() {
    console.log('import [--url <nextcloud-url>] [-u <username>] [-p <password>] [-o <output-path>]')
    exit(1)
}

main()
