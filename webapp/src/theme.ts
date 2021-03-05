// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type Theme = {
    mainBg: string,
    mainFg: string,
    buttonBg: string,
    buttonFg: string,
    sidebarBg: string,
    sidebarFg: string,
    sidebarWhiteLogo: string,

    link: string,
    linkVisited: string,

    propDefault: string,
    propGray: string,
    propBrown: string,
    propOrange: string,
    propYellow: string,
    propGreen: string,
    propBlue: string,
    propPurple: string,
    propPink: string,
    propRed: string,
}

export const defaultTheme = {
    mainBg: '255, 255, 255',
    mainFg: '55, 53, 47',
    buttonBg: '22, 109, 224',
    buttonFg: '255, 255, 255',
    sidebarBg: '20, 93, 191',
    sidebarFg: '255, 255, 255',
    sidebarWhiteLogo: 'true',

    link: '#0000ee',
    linkVisited: '#551a8b',

    propDefault: '#fff',
    propGray: '#EDEDED',
    propBrown: '#F7DDC3',
    propOrange: '#ffd3c1',
    propYellow: '#f7f0b6',
    propGreen: '#c7eac3',
    propBlue: '#B1D1F6',
    propPurple: '#e6d0ff',
    propPink: '#ffd6e9',
    propRed: '#ffa9a9',
}

export const darkTheme = {
    ...defaultTheme,

    mainBg: '55, 53, 47',
    mainFg: '200, 200, 200',
    buttonBg: '80, 170, 221',
    buttonFg: '255, 255, 255',
    sidebarBg: '75, 73, 67',
    sidebarFg: '255, 255, 255',
    sidebarWhiteLogo: 'true',

    link: '#0090ff',
    linkVisited: 'hsla(270, 68%, 70%, 1.0)',

    propDefault: 'hsla(0, 100%, 100%, 0.4)',
    propGray: 'hsla(0, 0%, 70%, 0.4)',
    propBrown: 'hsla(25, 60%, 40%, 0.4)',
    propOrange: 'hsla(35, 100%, 50%, 0.4)',
    propYellow: 'hsla(48, 100%, 70%, 0.4)',
    propGreen: 'hsla(120, 100%, 70%, 0.4)',
    propBlue: 'hsla(240, 100%, 70%, 0.4)',
    propPurple: 'hsla(270, 100%, 64%, 0.4)',
    propPink: 'hsla(310, 100%, 80%, 0.4)',
    propRed: 'hsla(4, 100%, 70%, 0.4)',
}

export const lightTheme = {
    ...defaultTheme,

    mainBg: '255, 255, 255',
    mainFg: '55, 53, 47',
    buttonBg: '80, 170, 221',
    buttonFg: '255, 255, 255',
    sidebarBg: '247, 246, 243',
    sidebarFg: '55, 53, 47',
    sidebarWhiteLogo: 'false',
}

export function setTheme(theme: Theme): void {
    const consolidatedTheme = {...defaultTheme, ...theme}

    document.documentElement.style.setProperty('--main-bg', consolidatedTheme.mainBg)
    document.documentElement.style.setProperty('--main-fg', consolidatedTheme.mainFg)
    document.documentElement.style.setProperty('--body-color', consolidatedTheme.mainFg)
    document.documentElement.style.setProperty('--button-bg', consolidatedTheme.buttonBg)
    document.documentElement.style.setProperty('--button-fg', consolidatedTheme.buttonFg)
    document.documentElement.style.setProperty('--sidebar-bg', consolidatedTheme.sidebarBg)
    document.documentElement.style.setProperty('--sidebar-fg', consolidatedTheme.sidebarFg)
    document.documentElement.style.setProperty('--sidebar-white-logo', consolidatedTheme.sidebarWhiteLogo)

    document.documentElement.style.setProperty('--link-color', consolidatedTheme.link)
    document.documentElement.style.setProperty('--link-visited-color', consolidatedTheme.linkVisited)

    document.documentElement.style.setProperty('--prop-default', consolidatedTheme.propDefault)
    document.documentElement.style.setProperty('--prop-gray', consolidatedTheme.propGray)
    document.documentElement.style.setProperty('--prop-brown', consolidatedTheme.propBrown)
    document.documentElement.style.setProperty('--prop-orange', consolidatedTheme.propOrange)
    document.documentElement.style.setProperty('--prop-yellow', consolidatedTheme.propYellow)
    document.documentElement.style.setProperty('--prop-green', consolidatedTheme.propGreen)
    document.documentElement.style.setProperty('--prop-blue', consolidatedTheme.propBlue)
    document.documentElement.style.setProperty('--prop-purple', consolidatedTheme.propPurple)
    document.documentElement.style.setProperty('--prop-pink', consolidatedTheme.propPink)
    document.documentElement.style.setProperty('--prop-red', consolidatedTheme.propRed)

    localStorage.setItem('theme', JSON.stringify(consolidatedTheme))
}

export function loadTheme(): Theme {
    const themeStr = localStorage.getItem('theme')
    if (themeStr) {
        try {
            const theme = JSON.parse(themeStr)
            setTheme(theme)
            return theme
        } catch (e) {
            setTheme(defaultTheme)
            return defaultTheme
        }
    } else {
        setTheme(defaultTheme)
        return defaultTheme
    }
}
