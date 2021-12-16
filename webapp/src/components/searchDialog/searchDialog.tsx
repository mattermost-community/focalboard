// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {ReactNode, useState} from 'react'

import './boardSwitcherDialog.scss'
import {FormattedMessage, useIntl} from 'react-intl'

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
        setResults(await props.searchHandler(query))
        setIsSearching(false)
    }

    const emptyResult = results.length === 0 && !isSearching && searchQuery

    return (
        <Dialog
            className='BoardSwitcherDialog'
            onClose={props.onClose}
        >
            <div className='CreateCategory'>
                <h3>{props.title}</h3>
                <h5>{props.subTitle}</h5>
                <input
                    className='searchQuery'
                    type='text'
                    onChange={(e) => searchHandler(e.target.value)}
                    autoFocus={true}
                    maxLength={100}
                />
                <div className='searchResults'>
                    {/*When there are results to show*/}
                    {results.length > 0 &&
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
                            <Search/>
                            <h4>
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
                        !emptyResult &&
                        <div className='initialScreen'>
                            <span>{'TODO: do we even need this?'}</span>
                        </div>
                    }
                </div>
            </div>
        </Dialog>
    )
}

export default SearchDialog
