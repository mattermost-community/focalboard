// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as fs from 'fs'
import minimist from 'minimist'
import {exit} from 'process'
import {ArchiveUtils} from '../util/archive'
import {Block} from '../../webapp/src/blocks/block'
import {Board} from '../../webapp/src/blocks/board'
import {IPropertyOption, IPropertyTemplate, createBoard} from '../../webapp/src/blocks/board'
import {createBoardView} from '../../webapp/src/blocks/boardView'
import {createCard} from '../../webapp/src/blocks/card'
import {createTextBlock} from '../../webapp/src/blocks/textBlock'
import {Item, Project, Section, Todoist} from './todoist'
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
const defaultSections = ['No Status', 'Next Up', 'In Progress', 'Completed', 'Archived'].map(title => {
    return {
        id: Utils.createGuid(),
        name: title,
    } as Section
})
let noStatusSectionID: any

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
    const input = JSON.parse(inputData) as Todoist

    const boards = [] as Board[]
    const blocks = [] as Block[]

    input.projects.forEach(project => {
        const [brds, blks] = convert(input, project)
        boards.push(...brds)
        blocks.push(...blks)
    })

    // Save output
    // TODO: Stream output
    const outputData = ArchiveUtils.buildBlockArchive(boards, blocks)
    fs.writeFileSync(outputFile, outputData)

    console.log(`Exported to ${outputFile}`)
}

function convert(input: Todoist, project: Project): [Board[], Block[]] {
    const boards: Board[] = []
    const blocks: Block[] = []

    if (project.name === 'Inbox') {
        return [boards, blocks]
    }

    // Board
    const board = createBoard()
    console.log(`Board: ${project.name}`)
    board.title = project.name
    board.description = project.name

    // Convert lists (columns) to a Select property
    const optionIdMap = new Map<string, string>()
    const options: IPropertyOption[] = []

    const columns = getProjectColumns(input, project)
    console.log("columns: " + JSON.stringify(columns))

    columns.forEach(list => {
        const optionId = Utils.createGuid()
        if (list.name === 'No Status') {
            noStatusSectionID = list.id
        }

        optionIdMap.set(String(list.id), optionId)
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
    const cards = getProjectCards(input, project)
    cards.forEach(card => {
        const outCard = createCard()
        outCard.title = card.content
        outCard.boardId = board.id
        outCard.parentId = board.id

        // Map lists to Select property options
        const cardSectionId = card.section_id ? card.section_id : noStatusSectionID
        const optionId = optionIdMap.get(String(cardSectionId))

        if (optionId) {
            outCard.fields.properties[cardProperty.id] = optionId
        } else {
            console.warn(`Invalid idList: ${cardSectionId} for card: ${card.content}`)
        }

        blocks.push(outCard)

        // console.log(`\t${card.desc}`)
        const text = createTextBlock()
        text.title = getCardDescription(input, card).join('\n\n')
        text.boardId = board.id
        text.parentId = outCard.id
        blocks.push(text)

        outCard.fields.contentOrder = [text.id]
    })

    return [boards, blocks]
}

function getProjectColumns(input: Todoist, project: Project): Array<Section> {
    const sections = [{
        id: noStatusSectionID,
        name: 'No Section',
    } as Section]
    sections.push(...input.sections.filter(section => section.project_id === project.id))

    return sections.length > 1 ? sections : defaultSections
}

function getProjectCards(input: Todoist, project: Project): Array<Item> {
    return input.items.filter(item => item.project_id === project.id)
}

function getCardDescription(input: Todoist, item: Item): Array<string> {
    return input.notes.filter(note => note.item_id === item.id).map(item => {
        let description = ""

        if (item.content) {
            description = item.content
        }

        if (item.file_attachment) {
            description += `\n\nAttachment: [${item.file_attachment.title}](${item.file_attachment.url})`
        }

        return description
    })
}

function showHelp() {
    exit(1)
}

main()
