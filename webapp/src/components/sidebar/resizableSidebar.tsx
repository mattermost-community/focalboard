// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import ResizablePanels from 'resizable-panels-react'

import Sidebar, {SidebarProps} from "./sidebar"


const ResizableSidebar = (props: SidebarProps): JSX.Element => {
    return (
        <ResizablePanels
            bkcolor="#ff0000"
            displayDirection="row"
            width="100%"
            height="800px"
            panelsSize={[40, 60]}
            sizeUnitMeasure="%"
            resizerColor="#353b48"
            resizerSize="30px"
        >
            <Sidebar {...props}/>
        </ResizablePanels>
    )
}

export default React.memo(ResizableSidebar)
