// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {CsvExporter} from '../../csvExporter'
import {UserContext} from '../../user'
import {BoardTree} from '../../viewModel/boardTree'
import IconButton from '../../widgets/buttons/iconButton'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import ModalWrapper from '../modalWrapper'
import ShareBoardComponent from '../shareBoardComponent'
import {sendFlashMessage} from '../flashMessages'

type Props = {
    boardTree: BoardTree
    intl: IntlShape
}

// async function testAddCards(boardTree: BoardTree, count: number) {
//     const {board, activeView} = boardTree

//     const startCount = boardTree.cards.length
//     let optionIndex = 0

//     mutator.performAsUndoGroup(async () => {
//         for (let i = 0; i < count; i++) {
//             const card = new MutableCard()
//             card.parentId = boardTree.board.id
//             card.rootId = boardTree.board.rootId
//             card.properties = CardFilter.propertiesThatMeetFilterGroup(activeView.filter, board.cardProperties)
//             card.title = `Test Card ${startCount + i + 1}`
//             card.icon = BlockIcons.shared.randomIcon()

//             if (boardTree.groupByProperty && boardTree.groupByProperty.options.length > 0) {
//                 // Cycle through options
//                 const option = boardTree.groupByProperty.options[optionIndex]
//                 optionIndex = (optionIndex + 1) % boardTree.groupByProperty.options.length
//                 card.properties[boardTree.groupByProperty.id] = option.id
//             }
//             mutator.insertBlock(card, 'test add card')
//         }
//     })
// }

// async function testDistributeCards(boardTree: BoardTree) {
//     mutator.performAsUndoGroup(async () => {
//         let optionIndex = 0
//         for (const card of boardTree.cards) {
//             if (boardTree.groupByProperty && boardTree.groupByProperty.options.length > 0) {
//                 // Cycle through options
//                 const option = boardTree.groupByProperty.options[optionIndex]
//                 optionIndex = (optionIndex + 1) % boardTree.groupByProperty.options.length
//                 const newCard = new MutableCard(card)
//                 if (newCard.properties[boardTree.groupByProperty.id] !== option.id) {
//                     newCard.properties[boardTree.groupByProperty.id] = option.id
//                     mutator.updateBlock(newCard, card, 'test distribute cards')
//                 }
//             }
//         }
//     })
// }

// async function testRandomizeIcons(boardTree: BoardTree) {
//     mutator.performAsUndoGroup(async () => {
//         for (const card of boardTree.cards) {
//             mutator.changeIcon(card, BlockIcons.shared.randomIcon(), 'randomize icon')
//         }
//     })
// }

function onExportCsvTrigger(boardTree: BoardTree, intl: IntlShape) {
    try {
        CsvExporter.exportTableCsv(boardTree)
        const exportCompleteMessage = intl.formatMessage({
            id: 'ViewHeader.export-complete',
            defaultMessage: 'Export complete!',
        })
        sendFlashMessage({content: exportCompleteMessage, severity: 'normal'})
    } catch (e) {
        const exportFailedMessage = intl.formatMessage({
            id: 'ViewHeader.export-failed',
            defaultMessage: 'Export failed!',
        })
        sendFlashMessage({content: exportFailedMessage, severity: 'high'})
    }
}

const ViewHeaderActionsMenu = React.memo((props: Props) => {
    const [showShareDialog, setShowShareDialog] = useState(false)

    const {boardTree, intl} = props

    return (
        <ModalWrapper>
            <MenuWrapper>
                <IconButton icon={<OptionsIcon/>}/>
                <Menu>
                    <Menu.Text
                        id='exportCsv'
                        name={intl.formatMessage({id: 'ViewHeader.export-csv', defaultMessage: 'Export to CSV'})}
                        onClick={() => onExportCsvTrigger(boardTree, intl)}
                    />
                    {/* <Menu.Text
                        id='exportBoardArchive'
                        name={intl.formatMessage({id: 'ViewHeader.export-board-archive', defaultMessage: 'Export board archive'})}
                        onClick={() => Archiver.exportBoardTree(boardTree)}
                    /> */}
                    <UserContext.Consumer>
                        {(user) => (user && user.id !== 'single-user' &&
                            <Menu.Text
                                id='shareBoard'
                                name={intl.formatMessage({id: 'ViewHeader.share-board', defaultMessage: 'Share board'})}
                                onClick={() => setShowShareDialog(true)}
                            />
                        )}
                    </UserContext.Consumer>

                    {/*

                <Menu.Separator/>

                <Menu.Text
                    id='testAdd100Cards'
                    name={intl.formatMessage({id: 'ViewHeader.test-add-100-cards', defaultMessage: 'TEST: Add 100 cards'})}
                    onClick={() => testAddCards(100)}
                />
                <Menu.Text
                    id='testAdd1000Cards'
                    name={intl.formatMessage({id: 'ViewHeader.test-add-1000-cards', defaultMessage: 'TEST: Add 1,000 cards'})}
                    onClick={() => testAddCards(1000)}
                />
                <Menu.Text
                    id='testDistributeCards'
                    name={intl.formatMessage({id: 'ViewHeader.test-distribute-cards', defaultMessage: 'TEST: Distribute cards'})}
                    onClick={() => testDistributeCards()}
                />
                <Menu.Text
                    id='testRandomizeIcons'
                    name={intl.formatMessage({id: 'ViewHeader.test-randomize-icons', defaultMessage: 'TEST: Randomize icons'})}
                    onClick={() => testRandomizeIcons()}
                />

                */}
                </Menu>
            </MenuWrapper>
            {showShareDialog &&
                <ShareBoardComponent
                    boardId={boardTree.board.id}
                    onClose={() => setShowShareDialog(false)}
                />
            }
        </ModalWrapper>
    )
})

export default injectIntl(ViewHeaderActionsMenu)
