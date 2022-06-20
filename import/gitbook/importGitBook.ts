// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as fs from 'fs'
import minimist from 'minimist'
import path from 'path'
import { exit } from 'process'
import { Block } from '../../webapp/src/blocks/block'
import { Board, createBoard } from '../../webapp/src/blocks/board'
import { BoardView, createBoardView } from '../../webapp/src/blocks/boardView'
import { Card, createCard } from '../../webapp/src/blocks/card'
import { createTextBlock, TextBlock } from '../../webapp/src/blocks/textBlock'
import {Utils} from '../../webapp/src/utils'
import { ArchiveUtils } from '../util/archive'

// HACKHACK: To allow Utils.CreateGuid to work
(global.window as any) = {}

let inputBaseFolder = ''
let outputFile: string
let board: Board
let view: BoardView
let brokenLinkCount = 0
let dupCardtitles = 0

const boards: Board[] = []
const blocks: Block[] = []
const allFiles: string[] = []
const allCardTitles: string[] = []
const filesToProcess: string[] = []
const filePathToCardTextMap: Map<string, TextBlock> = new Map()
const filePathToCardMap: Map<string, Card> = new Map()

function main() {
    const args: minimist.ParsedArgs = minimist(process.argv.slice(2))

    const inputFile = args['i']
    outputFile = args['o'] || 'archive.focalboard'

    if (!inputFile) {
        showHelp()
    }

    if (!fs.existsSync(inputFile)) {
        console.error(`File not found: ${inputFile}`)
        exit(2)
    }

    const dir = path.dirname(outputFile)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
    }

    inputBaseFolder = path.dirname(inputFile)
    const title = path.basename(inputFile)
    // Board
    board = createBoard()
    console.log(`Board: ${title}`)
    board.title = title
    boards.push(board)

    // Board view
    view = createBoardView()
    view.title = 'Board View'
    view.fields.viewType = 'board'
    view.boardId = board.id
    view.parentId = board.id
    blocks.push(view)

    allFiles.push(inputFile)
    filesToProcess.push(inputFile)
    while (filesToProcess.length > 0) {
        const filePath = filesToProcess.shift()!
        processFile(filePath)
    }

    // Update links
    for (const filePath of allFiles) {
        updateCardTextLinks(filePath)
    }

    const outputData = ArchiveUtils.buildBlockArchive(boards, blocks)
    fs.writeFileSync(outputFile, outputData)

    console.log(`Processed ${allFiles.length} file(s)`)
    console.log(`Exported ${blocks.length} block(s) to ${outputFile}`)
    if (brokenLinkCount > 0) {
        console.warn(`WARNING, Total broken links: ${brokenLinkCount}`)
    }
    if (dupCardtitles > 0) {
        console.warn(`WARNING, Total dup card titles: ${dupCardtitles}`)
    }
}

function titleFromFilePath(filePath: string) {
    let title = filePath
    if (path.parse(title).base === 'readme.md') {
        title = path.parse(title).dir
    }
    title = title.replace(/\//g, '-')
    title = path.parse(title).name
    return title
}

function processFile(filePath: string) {
    const relativePath = path.relative(inputBaseFolder, filePath)
    const fileData = fs.readFileSync(filePath, 'utf-8')

    console.log(`processFile: ${relativePath}`)

    console.log(`read ${fileData?.length} bytes.`)

    const card = createCard()
    card.title = titleFromFilePath(relativePath)
    card.boardId = board.id
    card.parentId = board.id
    blocks.push(card)
    filePathToCardMap.set(filePath, card)
    console.log(`ADDING filePathToCardMap: ${filePath}`)

    console.log(`Card title: ${card.title}`)

    if (!allCardTitles.includes(card.title)) {
        allCardTitles.push(card.title)
    } else {
        console.warn(`Duplicate card title: ${card.title}`)
        dupCardtitles += 1
    }

    // console.log(`\t${card.desc}`)
    const text = createTextBlock()
    text.title = fileData
    text.boardId = board.id
    text.parentId = card.id
    blocks.push(text)
    filePathToCardTextMap.set(filePath, text)

    card.fields.contentOrder = [text.id]

    // Find linked files
    const basePath = path.dirname(filePath)
    const linkRegex = /(?<!\!)\[([^\[]+)\](\(.*\))/gm
    const singleMatch = /(?<!\!)\[([^\[]+)\]\((.*)\)/

    const newFiles: string[] = []
    const matches = fileData.match(linkRegex) || []
    for (const match of matches) {
        const matchGroups = singleMatch.exec(match) || []
        if (matchGroups.length >= 2 && !isAbsoluteUrl(matchGroups[2])) {
            const relPath = fixRelPath(matchGroups[2])
            const fullPath = fixFullPath(basePath, relPath)
            // console.log(`${fullPath}`)
            newFiles.push(fullPath)
        }
    }

    console.log(`Found ${newFiles.length} linked file(s).`)
    for (const file of newFiles) {
        if (!allFiles.includes(file)) {
            if (fs.existsSync(file) && !fs.lstatSync(file).isDirectory()) {
                allFiles.push(file)
                filesToProcess.push(file)
            } else {
                console.error(`Broken link: ${file}`)
            }
        }
    }
}

function updateCardTextLinks(filePath: string) {
    const textBlock = filePathToCardTextMap.get(filePath)

    if (!textBlock) {
        console.error(`Missing textBlock for file: ${filePath}`)
        return
    }

    const basePath = path.dirname(filePath)

    let text = textBlock.title
    const linkRegex = /(?<!\!)\[([^\[]+)\](\(.*\))/gm
    const singleMatch = /(?<!\!)\[([^\[]+)\]\((.*)\)/
    text = text.replace(linkRegex, (match) => {
        const matchGroups = singleMatch.exec(match) || []
        if (matchGroups.length >= 2) {
            // Ignore full URLs
            const rawPath = matchGroups[2]
            if (isAbsoluteUrl(rawPath)) {
                return match
            }
            const relPath = fixRelPath(rawPath)
            const fullPath = fixFullPath(basePath, relPath)

            const card = filePathToCardMap.get(fullPath)
            if (!card) {
                brokenLinkCount += 1
                console.error(`CARD ERROR: ${filePath}`)
                console.error(`Cannot find card for file: ${fullPath}`)
                return `[${matchGroups[1]} (BROKEN LINK)](${rawPath})`
            }
            const slug = Utils.pageTitleToSlug(card.title)
            // const link = `[${matchGroups[1]}](/${board.id}/${view.id}/${cardId})`
            const link = `[[${matchGroups[1]}|${slug}]]`
            return link
        }
        console.error(`Erorr parsing link for: ${match}`)
        return match
    })

    textBlock.title = text
}

function isAbsoluteUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString)
        const result = Boolean(url.protocol)
        return result
    } catch {
        return false
    }
}

function fixRelPath(filePath: string): string {
    if (!filePath) { return filePath }
    const result = filePath.split('#').shift()!
    return result
}

function fixFullPath(basePath: string, filePath: string): string {
    if (!filePath) { return filePath }

    let result: string
    if (filePath.startsWith('/')) {
        result = path.join(inputBaseFolder, filePath)
    } else {
        result = path.join(basePath, filePath)
    }

    // Look for readme.md if the path is a directory
    if (fs.existsSync(result) && fs.lstatSync(result).isDirectory()) {
        result = path.join(result, 'readme.md')
    }

    return result
}

function showHelp() {
    console.log('import -i <input.md> -o [output.focalboard]')
    exit(1)
}

main()
