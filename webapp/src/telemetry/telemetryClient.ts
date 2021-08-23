// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IUser} from '../user'

import {TelemetryHandler} from './telemetry'

class TelemetryClient {
    public telemetryHandler?: TelemetryHandler
    public user?: IUser

    setTelemetryHandler(telemetryHandler?: TelemetryHandler): void {
        this.telemetryHandler = telemetryHandler
    }

    setUser(user: IUser): void {
        this.user = user
    }

    trackEvent(category: string, event: string, props?: any): void {
        if (this.telemetryHandler) {
            const userId = this.user?.id
            this.telemetryHandler.trackEvent(userId || '', '', category, event, props)
        }
    }

    pageVisited(category: string, name: string): void {
        if (this.telemetryHandler) {
            const userId = this.user?.id
            this.telemetryHandler.pageVisited(userId || '', '', category, name)
        }
    }
}

const telemetryClient = new TelemetryClient()

export {TelemetryClient}
export default telemetryClient
