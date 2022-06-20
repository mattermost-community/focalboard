// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export function propertyValueClassName(options: { readonly?: boolean } = {}): string {
    return `octo-propertyvalue${options.readonly ? ' octo-propertyvalue--readonly' : ''}`
}
