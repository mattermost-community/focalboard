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

(global.window as any) = {}

const optionColors = [
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

    const inputFile = args['i']
    const outputFile = args['o'] || 'test/archive.boardarchive'
    const testrailFormat = (args['t'] === 'true') || false

	if (!inputFile) {
		showHelp()
	}

	if (!fs.existsSync(inputFile)){
		console.log(`File not found: ${inputFile}`)
		exit(2)
	}

	console.log(`InputFile: ${inputFile}`)
    const input = await csv().fromFile(inputFile)
    console.log(`Read ${input.length} rows.`)
    console.log(input)

	const title = path.basename(inputFile, '.csv')
	console.log(`Title: ${title}`)

	const [boards, blocks] = convert(input, title, testrailFormat)
	const outputData = ArchiveUtils.buildBlockArchive(boards, blocks)

	fs.writeFileSync(outputFile, outputData)
	console.log(`Exported to ${outputFile}`)
}

function convert(input: any[], title: string, testrailFormat: boolean): [Board[], Block[]] {
    const boards: Board[] = []
    const blocks: Block[] = []

    // Board
    const board = createBoard()
    console.log(`Board: ${title}`)
    board.title = title

    // Each column is a card property
    const columns = getColumns(input)
    columns.forEach(column => {
        if(column === "Steps" && testrailFormat) {
            return
        } else {
            const cardProperty: IPropertyTemplate = {
                id: Utils.createGuid(),
                name: column,
                type: 'select',
                options: []
            }
            board.cardProperties.push(cardProperty)
        }
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
            if(key === "Steps" && testrailFormat) {
                const block = createTextBlock()
                block.title = value
                block.boardId = board.id
                block.parentId = outCard.id
                blocks.push(block)

                outCard.fields.contentOrder = [block.id]
                continue
            }
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
    })

    console.log('')
    console.log(`Found ${input.length} card(s).`)

    return [boards, blocks]
}

function getColumns(input: any[]) {
    const row = input[0]
    const keys = Object.keys(row)
    // The first key (column) is the card title
    return keys.slice(1)
}

function showHelp() {
    console.log('import -i <input.csv> -o [output.boardarchive]')
    exit(1)
}

main()
