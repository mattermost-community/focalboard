// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

describe('Create and delete page / subpage / subsubpage', () => {
    const timestamp = new Date().toLocaleString()
    const pageTitle = `Test Page (${timestamp})`
    const subpageTitle = `Test SubPage (${timestamp})`
    const subsubpageTitle = `Test SubSubPage (${timestamp})`

    beforeEach(() => {
        cy.apiInitServer()
        cy.apiResetBoards()
        cy.apiGetMe().then((userID) => cy.apiSkipTour(userID))
        localStorage.setItem('welcomePageViewed', 'true')
        localStorage.setItem('language', 'en')
        localStorage.setItem('isPagesE2ETests', 'true')
    })

    it('create new page from noPages screen', () => {
        // Visit a page and create new empty board
        cy.visit('/')
        cy.get('.NoPages').should('exist')

        cy.contains('Create new page').should('exist').click()
        cy.get('.SidebarBoardItem.subitem.active .IconButton').should('exist')
    })

    it('Can create and delete a page and subpage', () => {
        // Visit a page and create new empty board
        cy.visit('/')

        cy.contains('+ Add page').should('exist').click()

        // Change page title
        cy.log('**Change page title**')
        cy.get('.Editable.title').
            type(pageTitle).
            type('{enter}').
            should('have.value', pageTitle)

        // Hide and show the sidebar
        cy.log('**Hide and show the sidebar**')
        cy.get('.sidebarSwitcher').click()
        cy.get('.Sidebar .heading').should('not.exist')
        cy.get('.Sidebar .show-button').click()
        cy.get('.Sidebar .heading').should('exist')

        // Create subpage
        cy.get('.SidebarBoardItem.subitem.active .IconButton').click({force: true})
        cy.get('.SidebarBoardItem.subitem.active .AddIcon').should('exist').click()

        // Change subpage title
        cy.log('**Change page title**')
        cy.get('.Editable.title').
            type(subpageTitle).
            type('{enter}').
            should('have.value', subpageTitle)

        // Create subsubpage
        cy.get('.SidebarPageItem.active .IconButton').click({force: true})
        cy.get('.SidebarPageItem.active .AddIcon').should('exist').click({force: true})

        // Change subsubpage title
        cy.log('**Change page title**')
        cy.get('.Editable.title').
            type(subsubpageTitle).
            type('{enter}').
            should('have.value', subsubpageTitle)

        // Delete the subsubpage
        cy.get('.SidebarPageItem.active .IconButton').click({force: true})
        cy.get('.SidebarPageItem.active .DeleteIcon').should('exist').click({force: true})
        cy.get('.SidebarPageItem.active').should('not.exist')

        // Go to subpage
        cy.get('.SidebarPageItem').click()

        // Delete the subpage
        cy.get('.SidebarPageItem.active .IconButton').click({force: true})
        cy.get('.SidebarPageItem.active .DeleteIcon').should('exist').click({force: true})
        cy.get('.SidebarPageItem.active').should('not.exist')

        // Go to page
        cy.get('.SidebarBoardItem').click()

        // Delete the page
        cy.wait(500)
        cy.get('.SidebarBoardItem.subitem.active .IconButton').should('exist').click({force: true})
        cy.get('.SidebarBoardItem.subitem.active .DeleteIcon').should('exist').click()
        cy.get('.DeleteBoardDialog').should('exist')
        cy.get('.DeleteBoardDialog .Button.danger').should('exist').click()

        cy.get('.NoPages').should('exist')
    })

    const url = 'https://mattermost.com'
    const changedURL = 'https://mattermost.com/blog'

    it('Allows to create and edit URL property', () => {
        cy.visit('/')

        // Create new page
        cy.contains('+ Add page').should('exist').click()

        // Add URL property
        cy.log('**Add URL property**')
        cy.findByRole('button', {name: '+ Add a property'}).click()
        cy.findByRole('button', {name: 'URL'}).click()
        cy.findByRole('textbox', {name: 'URL'}).type('{enter}')

        // Enter URL
        cy.log('**Enter URL**')
        cy.findByPlaceholderText('Empty').type(`${url}{enter}`)

        // Check buttons
        cy.log('**Check buttons**')
        cy.findByRole('link', {name: url}).realHover()
        cy.findByRole('button', {name: 'Edit'}).should('exist')
        cy.findByRole('button', {name: 'Copy'}).should('exist')

        // Change URL
        cy.log('**Change URL**')
        cy.findByRole('link', {name: url}).realHover()
        cy.findByRole('button', {name: 'Edit'}).click()
        cy.findByRole('textbox', {name: url}).clear().type(`${changedURL}{enter}`)
        cy.findByRole('link', {name: changedURL}).should('exist')

        // Copy URL to clipboard
        cy.log('**Copy URL to clipboard**')
        cy.document().then((doc) => cy.spy(doc, 'execCommand')).as('exec')
        cy.findByRole('link', {name: changedURL}).realHover()
        cy.findByRole('button', {name: 'Copy'}).click()
        cy.findByText('Copied!').should('exist')
        cy.findByText('Copied!').should('not.exist')
        cy.get('@exec').should('have.been.calledOnceWith', 'copy')
    })

    it('Add other properties', () => {
        cy.visit('/')

        // Create new page
        cy.contains('+ Add page').should('exist').click()

        // Add property
        cy.findByRole('button', {name: '+ Add a property'}).click()
        cy.findByRole('button', {name: 'Created by'}).click()
        cy.findByRole('textbox', {name: 'Created by'}).type('{enter}')

        // Add property
        cy.findByRole('button', {name: '+ Add a property'}).click()
        cy.findByRole('button', {name: 'Created time'}).click()
        cy.findByRole('textbox', {name: 'Created time'}).type('{enter}')

        // Add property
        cy.findByRole('button', {name: '+ Add a property'}).click()
        cy.findByRole('button', {name: 'Person'}).click()
        cy.findByRole('textbox', {name: 'Person'}).type('{enter}')

        // Add property
        cy.findByRole('button', {name: '+ Add a property'}).click()
        cy.findByRole('button', {name: 'Text'}).click()
        cy.findByRole('textbox', {name: 'Text'}).type('{enter}')

        // Remove property
        cy.findByRole('button', {name: 'Created by'}).click()
        cy.findByRole('button', {name: 'Delete'}).click()
        cy.findByRole('button', {name: 'Delete'}).click()
        cy.findByRole('button', {name: 'Created by'}).should('not.exist')

        // Rename property
        cy.findByRole('button', {name: 'Created time'}).click()
        cy.findByRole('textbox', {name: 'Created time'}).type('Creation date{enter}')

        // Change property type
        cy.findByRole('button', {name: 'Text'}).click()
        cy.contains('Type: Text').realHover()
        cy.findByRole('button', {name: 'Email'}).click()
        cy.findByRole('button', {name: 'Change property'}).click()
        cy.contains('Type: Email').should('exist')
    })

    it('Add contents', () => {
        cy.visit('/')

        // Create new page
        cy.contains('+ Add page').should('exist').click()

        // Add title
        cy.contains('Add text or type "/" for commands').click()
        cy.focused().type('/title Title{enter}')
        cy.focused().type('{enter}')

        // Add subtitle
        cy.contains('Add text or type "/" for commands').click()
        cy.focused().type('/subtitle SubTitle{enter}{enter}')

        // Add subsubtitle
        cy.contains('Add text or type "/" for commands').click()
        cy.focused().type('/subsubtitle SubSubTitle{enter}{enter}')

        // Add divider
        cy.contains('Add text or type "/" for commands').click()
        cy.focused().type('/divider{enter}')

        // Add checkbox with prefix
        cy.contains('Add text or type "/" for commands').click()
        cy.focused().type('[ ] Checkbox 1{enter}')
        cy.focused().type('Checkbox2{enter}')
        cy.focused().type('Checkbox3{enter}')
        cy.focused().type('{backspace}')

        // Add quote with prefix
        cy.contains('Add text or type "/" for commands').click()
        cy.focused().type('> Quote{enter}')

        // Add list-item
        cy.contains('Add text or type "/" for commands').click()
        cy.focused().type('/list-item List item 1{enter}{enter}')
        cy.focused().type('List item 2{enter}')
        cy.focused().type('List item 3{enter}')
        cy.focused().type('{backspace}')

        // Add text item
        cy.contains('Add text or type "/" for commands').click()
        cy.focused().type('r')
        cy.get('.MarkdownEditorInput').should('exist').click()
        cy.focused().type('egular text{enter}')

        // Modify item
        cy.contains('regular text').click()
        cy.focused().type(' modified{enter}')

        // Add divider
        cy.contains('Add text or type "/" for commands').click()
        cy.focused().type('/divider{enter}')

        // Delete item
        const modifiedText = 'regular text modified'
        cy.contains(modifiedText).click()
        cy.focused().type('{backspace}'.repeat(modifiedText.length))
        cy.focused().type('{enter}')
        cy.contains('regular text modified').should('not.exist')
    })
})
