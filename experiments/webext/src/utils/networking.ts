// Copyright (c) 2021-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Board from "../utils/Board"

declare global {
  interface Window {
      msCrypto: Crypto
  }
}

async function request(method: string, host: string, resource: string, body: any, token: string | null) {
  const response = await fetch(`${host}/api/v2/${resource}`, {
    'credentials': 'include',
    'headers': {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Authorization': token ? `Bearer ${token}` : null
    } as HeadersInit,
    'body': body ? JSON.stringify(body) : null,
    'method': method
  })

  const json = await response.json()

  if (json.error) {
    throw json.error
  }

  return json
}

export async function logIn(host: string, username: string, password: string) {
  const json = await request('POST', host, 'login', { username: username, password: password, type: 'normal' }, null)
  return json.token
}

export async function getBoards(host: string, token: string) {
  const json = await request('GET', host, 'workspaces/0/blocks?type=board', null, token) as Board[]
  return json.filter(board => !board.isTemplate)
}

export async function findUrlPropertyId(host: string, token: string, boardId: string) {
  const json = await request('GET', host, `workspaces/0/blocks/${boardId}/subtree`, null, token)
  for (let obj of json) {
    if (obj.type === 'board') {
      for (let property of obj.fields.cardProperties) {
        if (property.type === 'url') {
          return property.id
        }
      }
      break // Only one board in subtree, no need to continue
    }
  }
  return null
}

export async function createCard(host: string, token: string, boardId: string, urlPropertyId: string, title: string, url: string) {
  let properties = {} as any
  if (urlPropertyId) {
    properties[urlPropertyId] = url
  }
  const card = {
    id: createGuid(),
    schema: 1,
    workspaceId: '',
    parentId: boardId,
    rootId: boardId,
    createdBy: '',
    modifiedBy: '',
    type: 'card',
    fields: {
      icon: null,
      properties: properties,
      contentOrder: [],
      isTemplate: false
    },
    title: title,
    createAt: Date.now(),
    updateAt: Date.now(),
    deleteAt: 0
  }
  await request('POST', host, 'workspaces/0/blocks', [card], token)
}

function createGuid(): string {
  const data = randomArray(16)
  return '7' + base32encode(data, false)
}

function randomArray(size: number): Uint8Array {
  const crypto = window.crypto || window.msCrypto
  const rands = new Uint8Array(size)
  if (crypto && crypto.getRandomValues) {
      crypto.getRandomValues(rands)
  } else {
      for (let i = 0; i < size; i++) {
          rands[i] = Math.floor((Math.random() * 255))
      }
  }
  return rands
}

const base32Alphabet = 'ybndrfg8ejkmcpqxot1uwisza345h769'

function base32encode(data: Int8Array | Uint8Array | Uint8ClampedArray, pad: boolean): string {
  const dview = new DataView(data.buffer, data.byteOffset, data.byteLength)
  let bits = 0
  let value = 0
  let output = ''

  // adapted from https://github.com/LinusU/base32-encode
  for (let i = 0; i < dview.byteLength; i++) {
      value = (value << 8) | dview.getUint8(i)
      bits += 8

      while (bits >= 5) {
          output += base32Alphabet[(value >>> (bits - 5)) & 31]
          bits -= 5
      }
  }
  if (bits > 0) {
      output += base32Alphabet[(value << (5 - bits)) & 31]
  }
  if (pad) {
      while ((output.length % 8) !== 0) {
          output += '='
      }
  }
  return output
}
