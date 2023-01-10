// // Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// // See LICENSE.txt for license information.

// import React from 'react'
// import {act} from 'react-dom/test-utils'
// import {ReactWrapper} from 'enzyme'
// import {Provider} from 'react-redux'


// describe('components/new_channel_modal', () => {

//     const actImmediate = (wrapper: ReactWrapper) =>
//         act(
//             () =>
//                 new Promise<void>((resolve) => {
//                     setImmediate(() => {
//                         wrapper.update()
//                         resolve()
//                     })
//                 }),
//         )

//     test('should show the boards template when the user clicks the create template checkbox', async () => {
//         const store = await mockStore(mockState)
//         const wrapper = mountWithIntl(
//             <Provider store={store}>
//                 <NewChannelModal/>
//             </Provider>,
//         )
//         const showTemplatesCheck = wrapper.find('.add-board-to-channel input')

//         showTemplatesCheck.simulate('change')

//         await actImmediate(wrapper)

//         const inputTemplatesSelector = wrapper.find('#input_select-board-template')

//         expect(inputTemplatesSelector).toHaveLength(1)
//     })

//     test('should show the list of templates when the templates selector is clicked', async () => {
//         const store = await mockStore(mockState)
//         const wrapper = mountWithIntl(
//             <Provider store={store}>
//                 <NewChannelModal/>
//             </Provider>,
//         )
//         const showTemplatesCheck = wrapper.find('.add-board-to-channel input')

//         showTemplatesCheck.simulate('change')

//         await actImmediate(wrapper)

//         const templatesSelector = wrapper.find('#input_select-board-template')

//         templatesSelector.simulate('click')

//         await actImmediate(wrapper)

//         const menuItems = wrapper.find('li.MenuItem')

//         const createEmptyBoardItem = wrapper.find('li#Empty_board')
//         expect(createEmptyBoardItem).toHaveLength(1)

//         // contains 3 items because of the create empty board menu item
//         expect(menuItems).toHaveLength(3)
//     })

//     test('when a board template is selected must call the switch to channel butoon', async () => {
//         const switchToChannelFn = jest.fn()
//         jest.spyOn(ChannelViewsActions, 'switchToChannel').mockImplementation(switchToChannelFn)

//         const name = 'New channel with board'
//         const mockChangeEvent = {
//             preventDefault: jest.fn(),
//             target: {
//                 value: name,
//             },
//         } as unknown as React.ChangeEvent<HTMLInputElement>

//         const wrapper = mountWithIntl(
//             <Provider store={store}>
//                 <NewChannelModal/>
//             </Provider>,
//         )

//         const genericModal = wrapper.find('GenericModal')
//         const displayName = genericModal.find('.new-channel-modal-name-input')
//         const confirmButton = genericModal.find('button[type=\'submit\']')

//         displayName.simulate('change', mockChangeEvent)

//         // Display name should be updated
//         expect((displayName.instance() as unknown as HTMLInputElement).value).toEqual(name)

//         // Confirm button should be enabled
//         expect((confirmButton.instance() as unknown as HTMLButtonElement).disabled).toEqual(false)

//         const showTemplatesCheck = wrapper.find('.add-board-to-channel input')

//         showTemplatesCheck.simulate('change')

//         await actImmediate(wrapper)

//         const templatesSelector = wrapper.find('#input_select-board-template')

//         templatesSelector.simulate('click')

//         await actImmediate(wrapper)

//         const firstTemplate = wrapper.find('li.MenuItem').at(0).find('button')

//         expect(firstTemplate).toHaveLength(1)

//         firstTemplate.simulate('click')

//         await actImmediate(wrapper)

//         // Submit
//         await act(async () => {
//             confirmButton.simulate('click')
//         })
//         expect(switchToChannelFn).toHaveBeenCalled()
//     })

//     test('if focalboard plugin is not enabled, the option to create a board should be hidden', async () => {
//         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//         // @ts-ignore
//         mockState.plugins.plugins = {} as ClientPluginManifest
//         const storeNoPlugins = await mockStore(mockState)
//         const wrapper = mountWithIntl(
//             <Provider store={storeNoPlugins}>
//                 <NewChannelModal/>
//             </Provider>,
//         )
//         const showTemplatesCheck = wrapper.find('.add-board-to-channel input')

//         expect(showTemplatesCheck).toHaveLength(0)
//     })
// })


// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {render, screen, act, fireEvent} from '@testing-library/react'
import {mocked} from 'jest-mock'

import userEvent from '@testing-library/user-event'

import octoClient from '../../../../webapp/src/octoClient'
import {mockStateStore} from '../../../../webapp/src/testUtils'
import {createBoard} from '../../../../webapp/src/blocks/board'
import {wrapIntl} from '../../../../webapp/src/testUtils'

import CreateBoardFromTemplate from './createBoardFromTemplate'

jest.mock('../../../../webapp/src/octoClient')
const mockedOctoClient = mocked(octoClient, true)

jest.mock('../../../../webapp/src/hooks/useGetAllTemplates', () => ({
    useGetAllTemplates: () => [{id: 'id', title: 'title', description: 'description', icon: 'icon'}]
}))

const wait = (ms: number) => {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })
}

describe('components/createBoardFromTemplate', () => {
    const team = {
        id: 'team-id',
        name: 'team',
        display_name: 'Team name',
    }
    const state = {
        teams: {
            allTeams: [team],
            current: team,
            currentId: team.id,
        },
        language: {
            value: 'en',
        },
        boards: {
            linkToChannel: 'channel-id',
        },
    }

    it('renders the Create Boards from template component', async () => {
        const store = mockStateStore([], state)
        let container: Element | DocumentFragment | null = null
        const setSelectedTemplate = jest.fn
        const toggleAddBoardCheckbox = jest.fn
        const newBoardInfoIcon = (<div>{'icon'}</div>)

        await act(async () => {
            const result = render(wrapIntl(
                <ReduxProvider store={store}>
                    <CreateBoardFromTemplate
                        setSelectedTemplate={setSelectedTemplate}
                        toggleAddBoardCheck={toggleAddBoardCheckbox}
                        newBoardInfoIcon={newBoardInfoIcon}
                    />
                </ReduxProvider>
            ))
            container = result.container
        })

        expect(container).toMatchSnapshot()
    })

    // it('renders without start searching', async () => {
    //     const store = mockStateStore([], state)
    //     const {container} = render(wrapIntl(
    //         <ReduxProvider store={store}>
    //             <CreateBoardFromTemplate/>
    //         </ReduxProvider>
    //     ))
    //     expect(container).toMatchSnapshot()
    // })
})
