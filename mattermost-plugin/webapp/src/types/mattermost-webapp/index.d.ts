// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
export interface PluginRegistry {
    registerPostTypeComponent(typeName: string, component: React.ElementType)
    registerChannelHeaderButtonAction(icon: React.Element, action: () => void, dropdownText: string, tooltipText: string)
    registerCustomRoute(route: string, component: React.ElementType)
    registerProductRoute(route: string, component: React.ElementType)
    unregisterComponent(componentId: string)
    registerProduct(baseURL: string, switcherIcon: string, switcherText: string, switcherLinkURL: string, mainComponent: React.ElementType, headerCompoent: React.ElementType)
    registerWebSocketEventHandler(event: string, handler: (e: any) => void)
    unregisterWebSocketEventHandler(event: string)

    // Add more if needed from https://developers.mattermost.com/extend/plugins/webapp/reference
}
