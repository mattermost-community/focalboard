// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {InlineStrategy} from '../pluginStrategy'
import findRangesWithRegex from '../utils/findRangesWithRegex'

const createULDelimiterStyleStrategy = (): InlineStrategy => {
    const ulDelimiterRegex = /^\* /g

    return {
        style: 'UL-DELIMITER',
        findStyleRanges: (block) => {
            const text = block.getText()
            const ulDelimiterRanges = findRangesWithRegex(text, ulDelimiterRegex)
            return ulDelimiterRanges
        },
        styles: {
            fontWeight: 'bold',
        },
    }
}

export default createULDelimiterStyleStrategy
