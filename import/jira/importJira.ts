// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as fs from 'fs'
import minimist from 'minimist'
import {exit} from 'process'
import {ArchiveUtils} from '../../webapp/src/blocks/archive'
import {Block} from '../../webapp/src/blocks/block'
import {IPropertyOption, IPropertyTemplate, createBoard} from '../../webapp/src/blocks/board'
import {createBoardView} from '../../webapp/src/blocks/boardView'
import {Card, createCard} from '../../webapp/src/blocks/card'
import {createTextBlock} from '../../webapp/src/blocks/textBlock'
import {Utils} from './utils'
import xml2js from 'xml2js'

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

async function main() {
    const args: minimist.ParsedArgs = minimist(process.argv.slice(2))

    const inputFile = args['i']
    const outputFile = args['o'] || 'archive.focalboard'

    if (!inputFile) {
        showHelp()
    }

    if (!fs.existsSync(inputFile)) {
        console.error(`File not found: ${inputFile}`)
        exit(2)
    }

    // Read input
	console.log(`Reading ${inputFile}`)
    const inputData = fs.readFileSync(inputFile, 'utf-8')

	if (!inputData) {
        console.error(`Unable to read data from file: ${inputFile}`)
        exit(2)
    }

	console.log(`Read ${Math.round(inputData.length / 1024)} KB`)

	const parser = new xml2js.Parser();
	const input = await parser.parseStringPromise(inputData)

	if (input?.rss?.channel?.length < 1) {
        console.error(`No channels in xml: ${inputFile}`)
        exit(2)
    }
    const channel = input.rss.channel[0]
    const items = channel.item

	// console.dir(items);

    // Convert
    const blocks = convert(items)

    // Save output
    // TODO: Stream output
    const outputData = ArchiveUtils.buildBlockArchive(blocks)
    fs.writeFileSync(outputFile, outputData)
    console.log(`Exported to ${outputFile}`)
}

function convert(items: any[]) {
    const blocks: Block[] = []

    // Board
    const board = createBoard()
    board.rootId = board.id
    board.title = 'Jira import'

    // Compile standard properties
    board.fields.cardProperties = []

    const priorityProperty = buildCardPropertyFromValues('Priority', items.map(o => o.priority[0]._))
    board.fields.cardProperties.push(priorityProperty)

    const statusProperty = buildCardPropertyFromValues('Status', items.map(o => o.status[0]._))
    board.fields.cardProperties.push(statusProperty)

    const typeProperty = buildCardPropertyFromValues('Type', items.map(o => o.type[0]._))
    board.fields.cardProperties.push(typeProperty)

    blocks.push(board)

    // Board view
    const view = createBoardView()
    view.title = 'Board View'
    view.fields.viewType = 'board'
    view.rootId = board.id
    view.parentId = board.id
    blocks.push(view)

    for (const item of items) {
        console.log(
            `Item: ${item.summary}, ` +
            `priority: ${item.priority[0]._}, ` +
            `status: ${item.status[0]._}, ` +
            `type: ${item.type[0]._}`)

        const card = createCard()
        card.title = item.title
        card.rootId = board.id
        card.parentId = board.id

        // Map standard properties
        setProperty(card, priorityProperty, item.priority[0]._)
        setProperty(card, statusProperty, item.status[0]._)
        setProperty(card, typeProperty, item.type[0]._)

        // TODO: Map custom properties

        if (item.description) {
            console.log(`\t${item.description}`)
            const text = createTextBlock()
            text.title = item.description
            text.rootId = board.id
            text.parentId = card.id
            blocks.push(text)

            card.fields.contentOrder = [text.id]
        }

        blocks.push(card)
    }

    return blocks
}

function buildCardPropertyFromValues(propertyName: string, allValues: string[]) {
    const options: IPropertyOption[] = []

    // Remove duplicate values
    const values = allValues.filter((x, y) => allValues.indexOf(x) == y);

    for (const value of values) {
        const optionId = Utils.createGuid()
        const color = optionColors[optionColorIndex % optionColors.length]
        optionColorIndex += 1
        const option: IPropertyOption = {
            id: optionId,
            value,
            color,
        }
        options.push(option)
    }

    const cardProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: propertyName,
        type: 'select',
        options
    }

    console.log(`Property: ${propertyName}, values: ${values}`)

    return cardProperty
}

function setProperty(card: Card, cardProperty: IPropertyTemplate, propertyValue: string) {
    const option = optionForPropertyValue(cardProperty, propertyValue)
    if (option) {
        card.fields.properties[cardProperty.id] = option.id
    }
}

function optionForPropertyValue(cardProperty: IPropertyTemplate, propertyValue: string): IPropertyOption | null {
    const option = cardProperty.options.find(o => o.value === propertyValue)
    if (!option) {
        console.error(`Property value not found: ${propertyValue}`)
        return null
    }

    return option
}

function showHelp() {
    console.log('import -i <input.xml> -o [output.focalboard]')
    exit(1)
}

main()
