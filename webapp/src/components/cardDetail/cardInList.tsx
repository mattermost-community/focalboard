// Copyright (c) 2024-present Midnight.Works. All Rights Reserved.

import React, {useState} from 'react';
import {IPropertyOption} from "../../blocks/board"
import Button from '../../widgets/buttons/button';

type Props = {
    columns: IPropertyOption | undefined
}

const CardInList = (props: Props) => {

    const [showBoardsSelector, setBoardsSelector] = useState(false)

    return (  
        <div className='list'>in list&nbsp;
            
            {/* <Button
                onClick={() => setBoardsSelector(!showBoardsSelector)}
                // onMouseOver={() => setLockFilterOnClose(true)}
                // onMouseLeave={() => setLockFilterOnClose(false)}
            ></Button> */}
            
             <span className='board-details'>{props.columns?.value}</span> </div>        
    )
}

export default CardInList


