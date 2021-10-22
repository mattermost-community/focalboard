// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createIntl} from 'react-intl'

import {Utils, IDType} from './utils'
import {IAppWindow} from './types'

declare let window: IAppWindow

describe('utils', () => {
    describe('assureProtocol', () => {
        test('should passthrough on valid short protocol', () => {
            expect(Utils.ensureProtocol('https://focalboard.com')).toBe('https://focalboard.com')
        })
        test('should passthrough on valid long protocol', () => {
            expect(Utils.ensureProtocol('somecustomprotocol://focalboard.com')).toBe('somecustomprotocol://focalboard.com')
        })

        test('should passthrough on valid short protocol', () => {
            expect(Utils.ensureProtocol('x://focalboard.com')).toBe('x://focalboard.com')
        })

        test('should add a https for empty protocol', () => {
            expect(Utils.ensureProtocol('focalboard.com')).toBe('https://focalboard.com')
        })
    })

    describe('createGuid', () => {
        test('should create 27 char random id for workspace', () => {
            expect(Utils.createGuid(IDType.Workspace)).toMatch(/^w[ybndrfg8ejkmcpqxot1uwisza345h769]{26}$/)
        })
        test('should create 27 char random id for board', () => {
            expect(Utils.createGuid(IDType.Board)).toMatch(/^b[ybndrfg8ejkmcpqxot1uwisza345h769]{26}$/)
        })
        test('should create 27 char random id for card', () => {
            expect(Utils.createGuid(IDType.Card)).toMatch(/^c[ybndrfg8ejkmcpqxot1uwisza345h769]{26}$/)
        })
        test('should create 27 char random id', () => {
            expect(Utils.createGuid(IDType.None)).toMatch(/^7[ybndrfg8ejkmcpqxot1uwisza345h769]{26}$/)
        })
    })

    describe('htmlFromMarkdown', () => {
        test('should not allow XSS on links href on the webapp', () => {
            expect(Utils.htmlFromMarkdown('[]("xss-attack="true"other="whatever)')).toBe('<p><a target="_blank" rel="noreferrer" href="%22xss-attack=%22true%22other=%22whatever" title="" onclick="event.stopPropagation();"></a></p>')
        })

        test('should not allow XSS on links href on the desktop app', () => {
            window.openInNewBrowser = () => null
            const expectedHtml = '<p><a target="_blank" rel="noreferrer" href="%22xss-attack=%22true%22other=%22whatever" title="" onclick="event.stopPropagation(); openInNewBrowser && openInNewBrowser(event.target.href);"></a></p>'
            expect(Utils.htmlFromMarkdown('[]("xss-attack="true"other="whatever)')).toBe(expectedHtml)
            window.openInNewBrowser = null
        })
    })

    describe('test - buildURL', () => {
        test('buildURL, no base', () => {
            expect(Utils.buildURL('test', true)).toBe('http://localhost/test')
            expect(Utils.buildURL('/test', true)).toBe('http://localhost/test')

            expect(Utils.buildURL('test')).toBe('/test')
            expect(Utils.buildURL('/test')).toBe('/test')
        })

        test('buildURL, base no slash', () => {
            window.baseURL = 'base'

            expect(Utils.buildURL('test', true)).toBe('http://localhost/base/test')
            expect(Utils.buildURL('/test', true)).toBe('http://localhost/base/test')

            expect(Utils.buildURL('test')).toBe('base/test')
            expect(Utils.buildURL('/test')).toBe('base/test')
        })

        test('buildUrl, base with slash', () => {
            window.baseURL = '/base/'

            expect(Utils.buildURL('test', true)).toBe('http://localhost/base/test')
            expect(Utils.buildURL('/test', true)).toBe('http://localhost/base/test')

            expect(Utils.buildURL('test')).toBe('base/test')
            expect(Utils.buildURL('/test')).toBe('base/test')
        })
    })

    describe('display date', () => {
        const intl = createIntl({locale: 'en-us'})

        it('should show month and day for current year', () => {
            const currentYear = new Date().getFullYear()
            const date = new Date(currentYear, 6, 9)
            expect(Utils.displayDate(date, intl)).toBe('July 09')
        })

        it('should show month, day and year for previous year', () => {
            const currentYear = new Date().getFullYear()
            const previousYear = currentYear - 1
            const date = new Date(previousYear, 6, 9)
            expect(Utils.displayDate(date, intl)).toBe(`July 09, ${previousYear}`)
        })
    })

    describe('input date', () => {
        const currentYear = new Date().getFullYear()
        const date = new Date(currentYear, 6, 9)

        it('should show mm/dd/yyyy for current year', () => {
            const intl = createIntl({locale: 'en-us'})
            expect(Utils.inputDate(date, intl)).toBe(`07/09/${currentYear}`)
        })

        it('should show dd/mm/yyyy for current year, es local', () => {
            const intl = createIntl({locale: 'es-es'})
            expect(Utils.inputDate(date, intl)).toBe(`09/07/${currentYear}`)
        })
    })

    describe('display date and time', () => {
        const intl = createIntl({locale: 'en-us'})

        it('should show month, day and time for current year', () => {
            const currentYear = new Date().getFullYear()
            const date = new Date(currentYear, 6, 9, 15, 20)
            expect(Utils.displayDateTime(date, intl)).toBe('July 09, 3:20 PM')
        })

        it('should show month, day, year and time for previous year', () => {
            const currentYear = new Date().getFullYear()
            const previousYear = currentYear - 1
            const date = new Date(previousYear, 6, 9, 5, 35)
            expect(Utils.displayDateTime(date, intl)).toBe(`July 09, ${previousYear}, 5:35 AM`)
        })
    })
})
