// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

declare namespace Cypress {
    type LoginData = {
        username: string
        password: string
    }
    type UserData = LoginData & {
        email: string
    }
    interface Chainable {
        apiRegisterUser: (data: UserData, token?: string, failOnError?: boolean) => Chainable
        apiLoginUser: (data: LoginData) => Chainable
        apiGetMe: () => Chainable<string>
        apiChangePassword: (userId: string, oldPassword: string, newPassword: string) => Chainable
        apiInitServer: () => Chainable
        apiDeleteBoard: (id: string) => Chainable
        apiResetBoards: () => Chainable
        apiSkipTour: (userID: string) => Chainable

        uiCreateNewBoard: (title?: string) => Chainable
        uiAddNewGroup: (name?: string) => Chainable
        uiAddNewCard: (title?: string, columnIndex?: number) => Chainable

        /**
         * Create a board on a given menu item.
         *
         * @param {string} item - one of the template menu options, ex. 'Empty board'
         */
        uiCreateBoard: (item: string) => Chainable
        uiCreateEmptyBoard: () => Chainable
    }
}
