// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as fs from 'fs'
import {exit} from 'process'
import {ArchiveUtils} from '../util/archive'
import {Block} from '../../webapp/src/blocks/block'
import {IPropertyOption, IPropertyTemplate, createBoard} from '../../webapp/src/blocks/board'
import {createBoardView} from '../../webapp/src/blocks/boardView'
import {Card, createCard} from '../../webapp/src/blocks/card'
import {createTextBlock} from '../../webapp/src/blocks/textBlock'
import {Utils} from './utils'
import xml2js, {ParserOptions} from 'xml2js'
import TurndownService from 'turndown'

// HACKHACK: To allow Utils.CreateGuid to work
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

var turndownService = new TurndownService()

async function run(inputFile: string, outputFile: string): Promise<number> {
    console.log(`input: ${inputFile}`)
    console.log(`output: ${outputFile}`)

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

    const parserOptions: ParserOptions = {
        explicitArray: false
    }
	const parser = new xml2js.Parser(parserOptions);
	const input = await parser.parseStringPromise(inputData)

	if (!input?.rss?.channel) {
        console.error(`No channels in xml: ${inputFile}`)
        exit(2)
    }
    const channel = input.rss.channel
    const items = channel.item

	// console.dir(items);

    // Convert
    const blocks = convert(items)

    // Save output
    // TODO: Stream output
    const outputData = ArchiveUtils.buildBlockArchive(blocks)
    fs.writeFileSync(outputFile, outputData)
    console.log(`Exported ${blocks.length} block(s) to ${outputFile}`)

    return blocks.length
}

function convert(items: any[]) {
    const blocks: Block[] = []

    // Board
    const board = createBoard()
    board.rootId = board.id
    board.title = 'Jira import'

    // Compile standard properties
    board.fields.cardProperties = []

    const priorityProperty = buildCardPropertyFromValues('Priority', items.map(o => o.priority?._))
    board.fields.cardProperties.push(priorityProperty)

    const statusProperty = buildCardPropertyFromValues('Status', items.map(o => o.status?._))
    board.fields.cardProperties.push(statusProperty)

    const resolutionProperty = buildCardPropertyFromValues('Resolution', items.map(o => o.resolution?._))
    board.fields.cardProperties.push(resolutionProperty)

    const typeProperty = buildCardPropertyFromValues('Type', items.map(o => o.type?._))
    board.fields.cardProperties.push(typeProperty)

    const assigneeProperty = buildCardPropertyFromValues('Assignee', items.map(o => o.assignee?._))
    board.fields.cardProperties.push(assigneeProperty)

    const reporterProperty = buildCardPropertyFromValues('Reporter', items.map(o => o.reporter?._))
    board.fields.cardProperties.push(reporterProperty)

    const originalUrlProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'Original URL',
        type: 'url',
        options: []
    }
    board.fields.cardProperties.push(originalUrlProperty)

    const createdDateProperty: IPropertyTemplate = {
        id: Utils.createGuid(),
        name: 'Created Date',
        type: 'date',
        options: []
    }
    board.fields.cardProperties.push(createdDateProperty)

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
            `priority: ${item.priority?._}, ` +
            `status: ${item.status?._}, ` +
            `type: ${item.type?._}`)

        const card = createCard()
        card.title = item.summary
        card.rootId = board.id
        card.parentId = board.id

        // Map standard properties
        if (item.priority?._) { setSelectProperty(card, priorityProperty, item.priority._) }
        if (item.status?._) { setSelectProperty(card, statusProperty, item.status._) }
        if (item.resolution?._) { setSelectProperty(card, resolutionProperty, item.resolution._) }
        if (item.type?._) { setSelectProperty(card, typeProperty, item.type._) }
        if (item.assignee?._) { setSelectProperty(card, assigneeProperty, item.assignee._) }
        if (item.reporter?._) { setSelectProperty(card, reporterProperty, item.reporter._) }

        if (item.link) { setProperty(card, originalUrlProperty.id, item.link)}
        if (item.created) {
            const dateInMs = Date.parse(item.created)
            setProperty(card, createdDateProperty.id, dateInMs.toString())
        }

        // TODO: Map custom properties

        if (item.description) {
            const description = turndownService.turndown(item.description)
            console.log(`\t${description}`)
            const text = createTextBlock()
            text.title = description
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

    // Remove empty and duplicate values
    const values = allValues.
        filter(o => !!o).
        filter((x, y) => allValues.indexOf(x) == y);

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

function setSelectProperty(card: Card, cardProperty: IPropertyTemplate, propertyValue: string) {
    const option = optionForPropertyValue(cardProperty, propertyValue)
    if (option) {
        card.fields.properties[cardProperty.id] = option.id
    }
}

function setProperty(card: Card, cardPropertyId: string, propertyValue: string) {
    card.fields.properties[cardPropertyId] = propertyValue
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

export { run }