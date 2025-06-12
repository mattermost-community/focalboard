// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as crypto from 'crypto'

class Utils {
    static createGuid(): string {
        function randomDigit() {
            if (crypto && crypto.randomBytes) {
                const rands = crypto.randomBytes(1)
                return (rands[0] % 16).toString(16)
            }

            return (Math.floor((Math.random() * 16))).toString(16)
        }
        return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, randomDigit)
    }
}

export { Utils }
