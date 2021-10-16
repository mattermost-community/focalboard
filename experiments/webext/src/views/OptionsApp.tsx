// Copyright (c) 2021-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { ChangeEvent, MouseEvent, useEffect, useState } from "react"

import Board from "../utils/Board"
import { getBoards, logIn } from "../utils/networking";
import { loadSettings, storeSettings, storeToken, storeBoardId } from "../utils/settings";

import "./OptionsApp.scss"

export default function OptionsApp() {
  const [host, setHost] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [boards, setBoards] = useState([] as Board[])
  const [boardId, setBoardId] = useState(null as string | null)
  const [inProgress, setInProgress] = useState(false)
  const [error, setError] = useState(null as string | null)

  useEffect(() => {
    async function initialiseBoards() {
      const settings = await loadSettings()
      if (settings.host) {
        setHost(settings.host)
      }
      if (settings.username) {
        setUsername(settings.username)
      }
      if (settings.token) {
        setToken(settings.token)
      }
      if (settings.boardId) {
        setBoardId(settings.boardId)
      }
      if (!settings.host || !settings.username || !settings.token) {
        setError('Unauthenticated')
        return
      }
      setInProgress(true)
      try {
        setBoards(await getBoards(settings.host, settings.token))
      } catch (error) {
        setError(`${error}`)
      } finally {
        setInProgress(false)
      }
    }
    initialiseBoards();
  }, [])

  function onAuthenticateButtonClicked(event: MouseEvent) {
    authenticate(host, username, password) 
    event.preventDefault()
    event.stopPropagation()
  }
  
  async function authenticate(host: string, username: string, password: string) {
    storeSettings(host, username, null, null)
    setBoards([])
    setBoardId(null)
    setInProgress(true)
    setError(null)
    try {
      const token = await logIn(host, username, password)
      storeToken(token)
      setToken(token)
      setBoards(await getBoards(host, token))
      const select = document.querySelector('select') as any
      select.value = null
    } catch (error) {
      setError(`${error}`)
    } finally {
      setInProgress(false)
    }
  }

  function onBoardSelectionChanged(event: ChangeEvent) {
    const id = (event.target as HTMLSelectElement).value
    storeBoardId(id)
    setBoardId(id)
    event.preventDefault()
    event.stopPropagation()
  }

  return <div className="OptionsApp">
    <label>Focalboard host</label>
    <input type="text" value={host} onChange={e => setHost(e.target.value)}/>
    <label>Username</label>
    <input type="text" value={username} onChange={e => setUsername(e.target.value)}/>
    <label>Password</label>
    <input type="password" value={password} onChange={e => setPassword(e.target.value)}/>
    <input type="submit" value="Authenticate" onClick={onAuthenticateButtonClicked}/>
    <div className="status">
      {inProgress && <div className="in-progress">
        Connecting to Focalboard server...
      </div>}
      {!inProgress && !error && <div className="success">
        Token: <span>{token}</span>
      </div>}
      {!inProgress && error && <div className="error">{error}</div>}
    </div>
    <br/>
    <br/>
    <label>Board</label>
    <select onChange={onBoardSelectionChanged}>
      {boards.map(board => <option value={board.id} selected={board.id === boardId}>{board.title}</option>)}
    </select>
  </div>
}
