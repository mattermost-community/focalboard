import csv from 'csvtojson'
import * as fs from 'fs'
import minimist from 'minimist'
import path from 'path'
import {exit} from 'process'
import {ArchiveUtils} from '../../webapp/src/blocks/archive'
import {IBlock} from '../../webapp/src/blocks/block'
import {IPropertyTemplate, MutableBoard} from '../../webapp/src/blocks/board'
import {MutableBoardView} from '../../webapp/src/blocks/boardView'
import {MutableCard} from '../../webapp/src/blocks/card'
import {MutableTextBlock} from '../../webapp/src/blocks/textBlock'
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
    const outputFile = args['o'] || 'archive.focalboard'

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
    const blocks = convert(input, title)

    // Save output
    // TODO: Stream output
    const outputData = ArchiveUtils.buildBlockArchive(blocks)
    fs.writeFileSync(outputFile, outputData)

    console.log(`Exported to ${outputFile}`)
}

function getCsvFilePath(inputFolder: string): string | undefined {
    const files = fs.readdirSync(inputFolder)
    const file = files.find(o => path.extname(o).toLowerCase() === '.csv')

    return file ? path.join(inputFolder, file) : undefined
}

function getMarkdown(cardTitle: string): string | undefined {
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

function convert(input: any[], title: string): IBlock[] {
    const blocks: IBlock[] = []

    // Board
    const board = new MutableBoard()
    console.log(`Board: ${title}`)
    board.rootId = board.id
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
    blocks.push(board)

    // Board view
    const view = new MutableBoardView()
    view.title = 'Board View'
    view.viewType = 'board'
    view.rootId = board.id
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

        const outCard = new MutableCard()
        outCard.title = title
        outCard.rootId = board.id
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

            outCard.properties[cardProperty.id] = option.id
        }

        blocks.push(outCard)

        // Card notes from markdown
        const markdown = getMarkdown(title)
        if (markdown) {
            console.log(`Markdown: ${markdown.length} bytes`)
            const text = new MutableTextBlock()
            text.title = markdown
            text.rootId = board.id
            text.parentId = outCard.id
            blocks.push(text)

            outCard.contentOrder = [text.id]
        }
    })

    console.log('')
    console.log(`Found ${input.length} card(s).`)

    return blocks
}

function showHelp() {
    console.log('import -i <input.json> -o [output.focalboard]')
    exit(1)
}

main()
