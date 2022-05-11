// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {ReactNode, useMemo, useState} from 'react'

import './searchDialog.scss'
import {FormattedMessage} from 'react-intl'

import {debounce} from 'lodash'

import Dialog from '../dialog'
import {Utils} from '../../utils'
import Search from '../../widgets/icons/search'

type Props = {
    onClose: () => void
    title: string
    subTitle?: string | ReactNode
    searchHandler: (query: string) => Promise<Array<ReactNode>>
    initialData?: Array<ReactNode>
}

const SearchDialog = (props: Props): JSX.Element => {
    const [results, setResults] = useState<Array<ReactNode>>(props.initialData || [])
    const [isSearching, setIsSearching] = useState<boolean>(false)
    const [searchQuery, setSearchQuery] = useState<string>('')

    const searchHandler = async (query: string): Promise<void> => {
        setIsSearching(true)
        setSearchQuery(query)
        const searchResults = await props.searchHandler(query)
        setResults(searchResults)
        setIsSearching(false)
    }

    const debouncedSearchHandler = useMemo(() => debounce(searchHandler, 200), [])

    const emptyResult = results.length === 0 && !isSearching && searchQuery

    return (
        <Dialog
            className='BoardSwitcherDialog'
            onClose={props.onClose}
        >
            <div className='BoardSwitcherDialogBody'>
                <div className='head'>
                    <h3 className='text-heading4'>{props.title}</h3>
                    <h5>{props.subTitle}</h5>
                    <div className='queryWrapper'>
                        <Search/>
                        <input
                            className='searchQuery'
                            placeholder='Search for boards'
                            type='text'
                            onChange={(e) => debouncedSearchHandler(e.target.value)}
                            autoFocus={true}
                            maxLength={100}
                        />
                    </div>
                </div>
                <div className='searchResults'>
                    {/*When there are results to show*/}
                    {searchQuery && results.length > 0 &&
                        results.map((result) => (
                            <div
                                key={Utils.uuid()}
                                className='searchResult'
                            >
                                {result}
                            </div>
                        ))
                    }

                    {/*when user searched for something and there were no results*/}
                    {
                        emptyResult &&
                        <div className='noResults'>
                            <div className='iconWrapper'>
                                <Search/>
                            </div>
                            <h4 className='text-heading4'>
                                <FormattedMessage
                                    id='FindBoardsDialog.NoResultsFor'
                                    defaultMessage='No results for "{searchQuery}"'
                                    values={{
                                        searchQuery,
                                    }}
                                />
                            </h4>
                            <span>
                                <FormattedMessage
                                    id='FindBoardsDialog.NoResultsSubtext'
                                    defaultMessage='Check the spelling or try another search.'
                                />
                            </span>
                        </div>
                    }

                    {/*default state, when user didn't search for anything. This is the initial screen*/}
                    {
                        !emptyResult && !searchQuery &&
                        <div className='noResults introScreen'>
                            <div className='iconWrapper'>
                                <Search/>
                            </div>
                            <h4 className='text-heading4'>
                                <FormattedMessage
                                    id='FindBoFindBoardsDialog.IntroText'
                                    defaultMessage='Search for boards'
                                />
                            </h4>
                        </div>
                    }
                </div>
            </div>
        </Dialog>
    )
}

export default SearchDialog
