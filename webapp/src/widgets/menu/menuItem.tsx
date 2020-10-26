// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

export type MenuOptionProps = {
    id: string,
    name: string,
    onClick?: (id: string) => void,
}
