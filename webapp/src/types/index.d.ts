// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
export interface IAppWindow extends Window {
    baseURL?: string
    frontendBaseURL?: string
    isFocalboardPlugin?: boolean
    msCrypto: Crypto
    openInNewBrowser?: ((href: string) => void) | null
    webkit?: {messageHandlers: {nativeApp?: {postMessage: <T>(message: T) => void}}}
}
