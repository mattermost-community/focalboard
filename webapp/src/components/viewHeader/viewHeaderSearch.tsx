// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useRef, useEffect} from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {BoardTree} from '../../viewModel/boardTree'
import Button from '../../widgets/buttons/button'
import Editable from '../../widgets/editable'

type Props = {
    boardTree: BoardTree
    setSearchText: (text?: string) => void
    intl: IntlShape
}

const ViewHeaderSearch = React.memo((props: Props) => {
    const {boardTree, intl} = props

    const searchFieldRef = useRef<Editable>(null)
    const [isSearching, setIsSearching] = useState(Boolean(props.boardTree.getSearchText()))
    const [searchValue, setSearchValue] = useState(boardTree.getSearchText())

    useEffect(() => {
        searchFieldRef.current?.focus()
    }, [isSearching])

    useEffect(() => {
        setSearchValue(boardTree.getSearchText())
    }, [boardTree])

    if (isSearching) {
        return (
            <Editable
                ref={searchFieldRef}
                value={searchValue}
                placeholderText={intl.formatMessage({id: 'ViewHeader.search-text', defaultMessage: 'Search text'})}
                onChange={setSearchValue}
                onCancel={() => {
                    setSearchValue('')
                    setIsSearching(false)
                    props.setSearchText('')
                }}
                onSave={() => {
                    if (searchValue === '') {
                        setIsSearching(false)
                    }
                    props.setSearchText(searchValue)
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
