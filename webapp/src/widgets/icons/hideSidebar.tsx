// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './hideSidebar.scss'

export default function HideSidebarIcon(): JSX.Element {
    // return (
    //     <svg
    //         xmlns='http://www.w3.org/2000/svg'
    //         className='HideSidebarIcon Icon'
    //         viewBox='0 0 100 100'
    //     >
    //         <polyline points='80,20 50,50 80,80'/>
    //         <polyline points='50,20 20,50, 50,80'/>
    //     </svg>
    // )
    return (
        <svg 
            width="21" 
            height="16" 
            viewBox="0 0 21 16"
            fill="none">
            <path d="M18.75 0H2.25C1.65326 0 1.08097 0.237053 0.65901 0.65901C0.237053 1.08097 0 1.65326 0 2.25V13.75C0 14.3467 0.237053 14.919 0.65901 15.341C1.08097 15.7629 1.65326 16 2.25 16H18.75C19.3467 16 19.919 15.7629 20.341 15.341C20.7629 14.919 21 14.3467 21 13.75V2.25C21 1.65326 20.7629 1.08097 20.341 0.65901C19.919 0.237053 19.3467 0 18.75 0ZM1.5 13.75V2.25C1.5 2.05109 1.57902 1.86032 1.71967 1.71967C1.86032 1.57902 2.05109 1.5 2.25 1.5H6.75V14.5H2.25C2.05109 14.5 1.86032 14.421 1.71967 14.2803C1.57902 14.1397 1.5 13.9489 1.5 13.75ZM19.5 13.75C19.5 13.9489 19.421 14.1397 19.2803 14.2803C19.1397 14.421 18.9489 14.5 18.75 14.5H8.25V1.5H18.75C18.9489 1.5 19.1397 1.57902 19.2803 1.71967C19.421 1.86032 19.5 2.05109 19.5 2.25V13.75Z" fill="#262B32"/>
            <rect x="3" y="3.5" width="2.3" height="1" fill="#262B32"/>
            <rect x="3" y="6.5" width="2.3" height="1" fill="#262B32"/>
            <rect x="3" y="9.5" width="2.3" height="1" fill="#262B32"/>
        </svg>
    )

}
