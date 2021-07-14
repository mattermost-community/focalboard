---
title: "User's Guide"
date: "2020-12-15T12:01:23-04:00"
section: "guide"
weight: 2
---

This guide is an overview of the basic features to get you started. Focalboard is an open source project that is being updated continuously.

[Let us know](/feedback/) if there's a feature you are looking for, or [connect with our vibrant community](/contribute/getting-started/) to help bring it to life.

## Adding new Boards

1. Select **+ Add Board** in the bottom left of the sidebar to add a new board to Focalboard.
2. Pick a template, such as **Project Tasks**, from the list.
3. This shows the first view of the new board, which is a table of all tasks.

![image](./all%20tasks.png)

4. Click on "By Status" in the sidebar to see a board view.

![image](./by%20status.png)

5. Click on the properties menu, and turn on "Priority" and "Date created". This will add those properties to the card display.

![image](./by%20status%20properties.png)

6. You can likewise change the **Group By**, **Filter**, and **Sort** settings of the view.
7. In general, all changes you make are saved immediately and are visible to all other users.

## Renaming Boards

Click on the board title to edit it. You can also set an icon on boards and cards.

## Adding new Views

Click on the dropdown next to the view name, and click **Add view** to add a new view.

![image](./add%20view.png)

### Dragging cards

Drag cards from one column to another to change their group-by property. For example, drag a card to the **Completed** column to mark it as completed.

When a board is unsorted, you can drag a card to a specific row in a column. For sorted boards, dragging a card to a column with auto-sort it using the specified sort settings.

### Editing cards

Select a card to edit it. A card consists of:

1. **A set of properties:** Properties are common to all cards in a board. Board views can group cards by "Select" type properties into different columns.
2. **A list of comments:** Comments are useful for noting important changes or milestones.
3. **A set of content:** The content of a card can consist of markdown text and images. Use this to record detailed specs or design decisions for an item for example.

Press ESC or click outside the card editor dialog to close the card editor.

### Table Views

Each column corresponds to a card property. Cells can be edited directly, or you can open the card editor for a row by hovering over the title and clicking "open".

Click on headers to sort them, or insert new properties.

![image](./table%20header%20menu.png)

### Card templates

Each board can have a set of card templates. To create a new card template, click on the dropdown by the "New" button and select "+ New template".

A card editor opens with a banner indicating this is a template.

You can new create new cards using this new template.

Alternatively, you can turn any card into a template:

1. Open the card editor.
2. Select the options menu (**...** at the top right), then select **New template from card**.

### Board templates

Similarly, you can create board templates from the "+ Add board" menu. To turn an existing board into a template:

1. Hover over the board title in the sidebar.
2. Select the options menu (**...**), then select **New template from board**.

![image](./board%20sidebar%20menu.png)

### Sharing boards

1. Hover over the right-hand side of the board menu.
2. Click on the options menu (**...**) and select **Share board**.
![image](./share%20board.png)

3. Turn the switch on which says **Publish to web and share this board with anyone**.
![image](./share%20board%20menu.png)

4. Copy the given link.
5. You can now share the copied link with others. Anyone with the link will be able to view the board)
6. Select **Regenerate Token** if you want to invalidate all the previously shared links.
7. A message asking **This will invalidate previously shared links. Continue?** will pop up. Select **OK** and the token will be regenerated.

### Archives

You can export an archive of all your boards from the settings menu.

![image](./settings%20menu.png)

This is handy to quickly back-up snapshots, or to transfer them to different installations, for example from a Personal Desktop to a server install. Note that the archive does not (currently) include image and file attachments, such as images included in a card.

Also note that importing an archive will overwrite changes to items, but will not affect additional items (e.g. boards and cards) that are not part of the archive.
