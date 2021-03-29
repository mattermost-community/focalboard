// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useRef, useEffect} from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {BoardTree} from '../../viewModel/boardTree'
import Button from '../../widgets/buttons/button'

import Editable from '../editable'

type Props = {
    boardTree: BoardTree
    setSearchText: (text?: string) => void
    intl: IntlShape
}

const ViewHeaderSearch = React.memo((props: Props) => {
    const searchFieldRef = useRef<Editable>(null)
    const [isSearching, setIsSearching] = useState(Boolean(props.boardTree.getSearchText()))

    useEffect(() => {
        searchFieldRef.current?.focus()
    }, [isSearching])

    const onSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.keyCode === 27) { // ESC: Clear search
            if (searchFieldRef.current) {
                searchFieldRef.current.text = ''
            }
            setIsSearching(false)
            props.setSearchText(undefined)
            e.preventDefault()
        }
        if (e.keyCode === 13 && searchFieldRef.current?.text.trim() === '') { // ENTER: with empty string clear search
            setIsSearching(false)
            props.setSearchText(undefined)
            e.preventDefault()
        }
    }

    const {boardTree, intl} = props

    if (isSearching) {
        return (
            <Editable
                ref={searchFieldRef}
                text={boardTree.getSearchText()}
                placeholderText={intl.formatMessage({id: 'ViewHeader.search-text', defaultMessage: 'Search text'})}
                style={{color: 'rgb(var(--main-fg))'}}
                onChanged={props.setSearchText}
                onKeyDown={(e) => {
                    onSearchKeyDown(e)
                }}
            />
        )
    }
    return (
        <Button onClick={() => setIsSearching(true)}>
            <FormattedMessage
                id='ViewHeader.search'
                defaultMessage='Search'
            />
        </Button>
    )
})

export default injectIntl(ViewHeaderSearch)
