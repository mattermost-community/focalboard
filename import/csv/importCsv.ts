import archiver from 'archiver';
import { customAlphabet } from 'nanoid';
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

    // split output file of version line + boardLines into two fields
    const [version, ...boardLines] = outputData.split('\n');
    const boardData = boardLines.join('\n');

    // Generate a UUID for the board directory
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const generateBase32Identifier = customAlphabet(alphabet, 27);

    // Generate an identifier
    const newIdentifier = generateBase32Identifier();

    // Create a zip archive in memory
    const output = fs.createWriteStream(outputFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        console.log(`Archive created successfully: ${outputFile} (${archive.pointer()} total bytes)`);
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);

    // Add version.json to the root of the archive
    archive.append(version, { name: 'version.json' });

    // Add board.jsonl to a UUID-named directory within the archive
    archive.append(boardData, { name: `${newIdentifier}/board.jsonl` });

    // Finalize the archive
    await archive.finalize();

	// fs.writeFileSync(outputFile, outputData)
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
        if(column === "Description" && testrailFormat) {
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

    // Card properties that shouldn't be read into options
    const excludedProperties = ["URL", "Author", "Author Username", "Assignee", "Created At (UTC)", "Created At (UTC)", "Closed At (UTC)", "Issue ID", "Updated At (UTC)", "Labels" ];

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
            if(key === "Description" && testrailFormat) {
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
            // Check if the property is excluded from having options
            if (excludedProperties.includes(cardProperty.name)) {
                console.log(`Skipping options for property: ${cardProperty.name}`);
                continue;
            }
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
