// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

function useStickyState<S>(defaultValue: S, key: string): [S, React.Dispatch<React.SetStateAction<S>>] {
    const [value, setValue] = React.useState(() => {
        const stickyValue = window.localStorage.getItem(key)
        return stickyValue === null ? defaultValue : JSON.parse(stickyValue)
    })
    React.useEffect(() => {
        window.localStorage.setItem(key, JSON.stringify(value))
    }, [key, value])
    return [value, setValue]
}

export {useStickyState}
