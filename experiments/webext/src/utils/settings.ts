// Copyright (c) 2021-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import browser from 'webextension-polyfill'

interface Settings {
  host: string | null
  username: string | null
  token: string | null
  boardId: string | null
}
 
export function loadSettings(): Settings {
  return browser.storage.sync.get(['host', 'username', 'token', 'boardId'])
}

export function storeSettings(host: string, username: string, token: string | null, boardId: string | null) {
  console.log(`storing host ${host}`)
  return browser.storage.sync.set({ host: host, username: username, token: token, boardId: boardId })
}

export function storeToken(value: string | null) {
  return browser.storage.sync.set({ token: value })
}

export function storeBoardId(value: string | null) {
  return browser.storage.sync.set({ boardId: value })
}
  