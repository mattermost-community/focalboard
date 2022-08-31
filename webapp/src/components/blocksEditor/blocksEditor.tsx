import React, {useState} from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import Editor from './editor'
import {BlockData} from './blocks/types'
import BlockContent from './blockContent'
import * as registry from './blocks'

type Props = {
    onBlockCreated: (block: BlockData, afterBlock?: BlockData) => BlockData|null
    onBlockModified: (block: BlockData) => BlockData|null
    onBlockMoved: (block: BlockData, afterBlock: BlockData) => void
    blocks: BlockData[]
}

function BlocksEditor(props: Props) {
  const [editing, setEditing] = useState<BlockData|null>(null)
  const [afterBlock, setAfterBlock] = useState<BlockData|null>(null)
  return (
      <div
          className="BlocksEditor"
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'ArrowUp') {
                  if (editing === null) {
                      if (afterBlock === null) {
                          setEditing(props.blocks[props.blocks.length - 1] || null)
                      } else {
                          setEditing(afterBlock)
                      }
                      setAfterBlock(null)
                      return
                  }
                  let prevBlock = null
                  for (const b of props.blocks) {
                      if (editing?.id === b.id) {
                          break
                      }
                      const blockType = registry.get(b.contentType)
                      if (blockType.editable) {
                          prevBlock = b
                      }
                  }
                  if (prevBlock) {
                      setEditing(prevBlock)
                      setAfterBlock(null)
                  }
              } else if (e.key === 'ArrowDown') {
                  let currentBlock = editing
                  if (currentBlock === null) {
                      currentBlock = afterBlock
                  }
                  if (currentBlock === null) {
                      return
                  }

                  let nextBlock = null
                  let breakNext = false
                  for (const b of props.blocks) {
                      if (breakNext) {
                          const blockType = registry.get(b.contentType)
                          if (blockType.editable) {
                              nextBlock = b
                              break
                          }
                      }
                      if (currentBlock.id === b.id) {
                          breakNext = true
                      }
                  }
                  setEditing(nextBlock)
                  setAfterBlock(null)
              }
          }}
      >
          <DndProvider backend={HTML5Backend}>
              {Object.values(props.blocks).map((d) => (
                  <div
                      key={d.id}
                  >
                      <BlockContent
                          key={d.id}
                          block={d}
                          editing={editing}
                          setEditing={(block) => {
                              setEditing(block)
                              setAfterBlock(null)
                          }}
                          setAfterBlock={setAfterBlock}
                          onSave={props.onBlockModified}
                          onMove={props.onBlockMoved}
                      />
                      {afterBlock && afterBlock.id === d.id && (
                          <Editor
                              onSave={(b) => {
                                  const newBlock = props.onBlockCreated(b, afterBlock)
                                  setAfterBlock(newBlock)
                                  return newBlock
                              }}
                          />)}
                  </div>
              ))}
              {!editing && !afterBlock && <Editor onSave={props.onBlockCreated}/>}
          </DndProvider>
    </div>
  );
}

export default BlocksEditor;
