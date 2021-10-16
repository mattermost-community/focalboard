// Copyright (c) 2021-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, { useEffect, useState } from "react"

import browser from 'webextension-polyfill'

import { createCard, findUrlPropertyId } from "../utils/networking";
import { loadSettings } from "../utils/settings";

import "./PopupApp.scss"

export default function OptionsApp() {
  const [board, setBoard] = useState('')
  const [inProgress, setInProgress] = useState(false)
  const [error, setError] = useState(null as string | null)

  useEffect(() => {
    async function createCardFromCurrentTab() {
      const settings = await loadSettings()
      if (!settings.host || !settings.token) {
        setError('Looks like you\'re unauthenticated. Please configure the extension\'s settings first.')
        return
      }
      if (!settings.boardId) {
        setError('Looks like you haven\'t selected a board to save to yet. Please configure the extension\'s settings first.')
        return
      }
      setInProgress(true)
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true })
        const urlPropertyId = await findUrlPropertyId(settings.host as string, settings.token as string, settings.boardId as string)
        await createCard(settings.host as string, settings.token as string, settings.boardId as string, urlPropertyId, tabs[0].title, tabs[0].url)    
        setBoard(`${settings.host}/${settings.boardId}`)    
      } catch (error) {
        setError(`${error}`)
      } finally {
        setInProgress(false)
      }
    }
    createCardFromCurrentTab();
  }, [])
  
  return <div className="PopupApp">
    <div className="status">
      {inProgress && <div className="in-progress">
        Saving to Focalboard...
      </div>}
      {!inProgress && !error && <div className="success">
        Saved to <a href={board} target="_blank">board</a>
      </div>}
      {!inProgress && error && <div className="error">{error}</div>}
    </div>
  </div>
}
