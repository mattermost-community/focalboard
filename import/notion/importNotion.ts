import csv from 'csvtojson'
import * as fs from 'fs'
import minimist from 'minimist'
import path from 'path'
import {exit} from 'process'
import {ArchiveUtils} from '../util/archive'
import {Block} from '../../webapp/src/blocks/block'
import {Board} from '../../webapp/src/blocks/board'
import {IPropertyTemplate, createBoard} from '../../webapp/src/blocks/board'
import {createBoardView} from '../../webapp/src/blocks/boardView'
import {createCard} from '../../webapp/src/blocks/card'
import {createTextBlock} from '../../webapp/src/blocks/textBlock'
import {Utils} from './utils'

// HACKHACK: To allow Utils.CreateGuid to work
(global.window as any) = {}

let markdownFolder: string

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

async function main() {
    const args: minimist.ParsedArgs = minimist(process.argv.slice(2))

    const inputFolder = args['i']
    const outputFile = args['o'] || 'archive.boardarchive'

    if (!inputFolder) {
        showHelp()
    }

    if (!fs.existsSync(inputFolder)){
        console.log(`Folder not found: ${inputFolder}`)
        exit(2)
    }

    const inputFile = getCsvFilePath(inputFolder)
    if (!inputFile) {
        console.log(`.csv file not found in folder: ${inputFolder}`)
        exit(2)
    }

    console.log(`inputFile: ${inputFile}`)

    // Read input
    const input = await csv().fromFile(inputFile)

    console.log(`Read ${input.length} rows.`)

    console.log(input)

    const basename = path.basename(inputFile, '.csv')
    const components = basename.split(' ')
    components.pop()
    const title = components.join(' ')

    console.log(`title: ${title}`)

    markdownFolder = path.join(inputFolder, basename)

    // Convert
    const [boards, blocks] = convert(input, title)

    // Save output
    // TODO: Stream output
    const outputData = ArchiveUtils.buildBlockArchive(boards, blocks)
    fs.writeFileSync(outputFile, outputData)

    console.log(`Exported to ${outputFile}`)
}

function getCsvFilePath(inputFolder: string): string | undefined {
    const files = fs.readdirSync(inputFolder)
    const file = files.find(o => path.extname(o).toLowerCase() === '.csv')

    return file ? path.join(inputFolder, file) : undefined
}

function getMarkdown(cardTitle: string): string | undefined {
    if (!fs.existsSync(markdownFolder)){ return undefined}
    const files = fs.readdirSync(markdownFolder)
    const file = files.find((o) => {
        const basename = path.basename(o)
        const components = basename.split(' ')
        const fileCardTitle = components.slice(0, components.length-1).join(' ')
        if (fileCardTitle === cardTitle) {
            return o
        }
    })

    if (file) {
        const filePath = path.join(markdownFolder, file)
        const markdown = fs.readFileSync(filePath, 'utf-8')

        // TODO: Remove header from markdown, which repets card title and properties
        return markdown
    }

    return undefined
}

function getColumns(input: any[]) {
    const row = input[0]
    const keys = Object.keys(row)
    // The first key (column) is the card title
    return keys.slice(1)
}

function convert(input: any[], title: string): [Board[], Block[]] {
    const boards: Board[] = []
    const blocks: Block[] = []

    // Board
    const board = createBoard()
    console.log(`Board: ${title}`)
    board.title = title

    // Each column is a card property
    const columns = getColumns(input)
    columns.forEach(column => {
        const cardProperty: IPropertyTemplate = {
            id: Utils.createGuid(),
            name: column,
            type: 'select',
            options: []
        }
        board.cardProperties.push(cardProperty)
    })

    // Set all column types to select
    // TODO: Detect column type
    boards.push(board)

    // Board view
    const view = createBoardView()
    view.title = 'Board View'
    view.fields.viewType = 'board'
    view.boardId = board.id
    view.parentId = board.id
    blocks.push(view)

    // Cards
    input.forEach(row => {
        const keys = Object.keys(row)
        console.log(keys)
        if (keys.length < 1) {
            console.error(`Expected at least one column`)
            return blocks
        }

        const titleKey = keys[0]
        const title = row[titleKey]

        console.log(`Card: ${title}`)

        const outCard = createCard()
        outCard.title = title
        outCard.boardId = board.id
        outCard.parentId = board.id

        // Card properties, skip first key which is the title
        for (const key of keys.slice(1)) {
            const value = row[key]
            if (!value) {
                // Skip empty values
                continue
            }

            const cardProperty = board.cardProperties.find((o) => o.name === key)!
            let option = cardProperty.options.find((o) => o.value === value)
            if (!option) {
                const color = optionColors[optionColorIndex % optionColors.length]
                optionColorIndex += 1
                option = {
                    id: Utils.createGuid(),
                    value,
                    color: color,
                }
                cardProperty.options.push(option)
            }

            outCard.fields.properties[cardProperty.id] = option.id
        }

        blocks.push(outCard)

        // Card notes from markdown
        const markdown = getMarkdown(title)
        if (markdown) {
            console.log(`Markdown: ${markdown.length} bytes`)
            const text = createTextBlock()
            text.title = markdown
            text.boardId = board.id
            text.parentId = outCard.id
            blocks.push(text)

            outCard.fields.contentOrder = [text.id]
        }
    })

    console.log('')
    console.log(`Found ${input.length} card(s).`)

    return [boards, blocks]
}

function showHelp() {
    console.log('import -i <input.json> -o [output.boardarchive]')
    exit(1)
}

main()
