// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {BoardView} from './blocks/boardView'
import {BoardTree} from './viewModel/boardTree'
import {OctoUtils} from './octoUtils'
import {Utils} from './utils'

class CsvExporter {
    static exportTableCsv(boardTree: BoardTree, view?: BoardView): void {
        const {activeView} = boardTree
        const viewToExport = view ?? activeView

        const rows = CsvExporter.generateTableArray(boardTree, view)

        let csvContent = 'data:text/csv;charset=utf-8,'

        rows.forEach((row) => {
            const encodedRow = row.join(',')
            csvContent += encodedRow + '\r\n'
        })

        const filename = `${Utils.sanitizeFilename(viewToExport.title)}.csv`
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.style.display = 'none'
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', filename)
        document.body.appendChild(link)						// FireFox support

        link.click()

        // TODO: Remove or reuse link
    }

    private static generateTableArray(boardTree: BoardTree, view?: BoardView): string[][] {
        const {board, cards, activeView} = boardTree
        const viewToExport = view ?? activeView

        const rows: string[][] = []
        const visibleProperties = board.cardProperties.filter((template) => viewToExport.visiblePropertyIds.includes(template.id))

        {
            // Header row
            const row: string[] = []
            visibleProperties.forEach((template) => {
                row.push(template.name)
            })
            rows.push(row)
        }

        cards.forEach((card) => {
            const row: string[] = []
            visibleProperties.forEach((template) => {
                const propertyValue = card.properties[template.id]
                const displayValue = OctoUtils.propertyDisplayValue(card, propertyValue, template) || ''
                if (template.type === 'number') {
                    const numericValue = propertyValue ? Number(propertyValue).toString() : undefined
                    row.push(numericValue)
                } else {
                    // Export as string
                    row.push(`"${displayValue}"`)
                }
            })
            rows.push(row)
        })

        return rows
    }
}

export {CsvExporter}
