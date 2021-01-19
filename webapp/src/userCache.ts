// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import octoClient from './octoClient'
import {IUser} from './user'

class UserCache {
    static shared = new UserCache()

    private cache = new Map<string, IUser>()

    async getUser(userId: string): Promise<IUser | undefined> {
        let user = this.cache.get(userId)
        if (!user) {
            user = await octoClient.getUser(userId)
            if (user) {
                this.cache.set(userId, user)
            }
        }

        return user || undefined
    }

    clear(): void {
        this.cache.clear()
    }
}

export {UserCache}
