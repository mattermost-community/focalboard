# Import, export, and back up data

## Import data into Focalboard

You can import data from other tools to use with Focalboard.

### Import from Asana

This node app converts an Asana JSON archive into a ``.boardarchive`` file. The script imports all cards from a single board, including their section (column) membership, names, and notes.

1. Log into your Asana account.
2. Select the drop-down menu next to the Asana board's name. Then select **Export/Print > JSON**. This will create an archive file.
3. Save the file locally, e.g. to ``asana.json``.
4. Open a terminal window on your local machine and clone the focalboard repository to a local directory, e.g. to ``focalboard``: ``git clone https://github.com/mattermost/focalboard focalboard``
5. Navigate to ``focalboard/webapp``.
6. Run ``npm install``.
7. Change directory to ``focalboard/import/asana``.
8. Run ``npm install``.
9. From within the same folder, run ``npx ts-node importAsana.ts -i <asana.json> -o archive.boardarchive``. This generates the following data:

    ```
    My-MacbookPro:asana macbook$ npx ts-node importAsana.ts -i ~/Downloads/asana.json -o archive.boardarchive
    Board: 1:1 Meeting Agenda Test
    Card: [READ ME] Instructions for using this project
    Card: [EXAMPLE TASK] Feedback on design team presentation
    Card: [EXAMPLE TASK] Finalize monthly staffing plan
    Card: [EXAMPLE TASK] Review Q2 launch video outline
    Card: [EXAMPLE TASK] Mentor a peer

    Found 5 card(s).
    Exported to archive.boardarchive
    ```

10. In Focalboard, open the board you want to use for the export.
11. Select **Settings > Import archive** and select ``archive.boardarchive``.
12. Select **Upload**.
13. Return to your board and confirm that your Asana data is now displaying.

If you don't see your Asana data, an error should be displayed. You can also check log files for errors.

### Import from Notion

This node app converts a Notion CSV and markdown export into a ``.boardarchive`` file. The script imports all cards from a single board, including their properties and markdown content.

**Note**: The Notion export format does not preserve property types, so the script currently imports all card properties as a Select type. You can change the type after importing into Focalboard.

1. From a Notion Board, open the **...** menu at the top right corner of the board.
2. Select `Export` and pick `Markdown & CSV` as the export format.
3. Save the generated file locally, and unzip the folder.
4. Open a terminal window on your local machine and clone the focalboard repository to a local directory, e.g. to ``focalboard``: ``git clone https://github.com/mattermost/focalboard focalboard``
5. Navigate to ``focalboard/webapp``.
6. Run ``npm install``.
7. Change directory to ``focalboard/import/notion``.
8. Run ``npm install``.
9. From within the same folder, run ``npx ts-node importNotion.ts -i <path to the notion-export folder> -o archive.boardarchive``.
10. In Focalboard, open the board you want to use for the export.
11. Select **Settings > Import archive** and select ``archive.boardarchive``.
12. Select **Upload**.
13. Return to your board and confirm that your Notion data is now displaying.

### Import from Jira

This node app converts a Jira ``.XML`` export into a ``.boardarchive`` file. The script imports each item as a card into a single board. Users are imported as Select properties, with the name of the user.

**Notes**:
- Jira ``.XML`` export is limited to 1000 issues at a time.
- The following aren't currently imported: custom properties, comments, and embedded files.

1. Open Jira advanced search, and search for all the items to export.
2. Select **Export > Export XML**.
3. Save the generated file locally, e.g. to ``jira_export.xml``.
4. Open a terminal window on your local machine and clone the focalboard repository to a local directory, e.g. to ``focalboard``: ``git clone https://github.com/mattermost/focalboard focalboard``
5. Navigate to ``focalboard/webapp``.
6. Run ``npm install``.
7. Change directory to ``focalboard/import/jira`.
8. Run ``npm install``.
9. From within the same folder, run ``npx ts-node importJira.ts -i <path-to-jira.xml> -o archive.boardarchive``.
10. In Focalboard, open the board you want to use for the export.
11. Select **Settings > Import archive** and select ``archive.boardarchive``.
12. Select **Upload**.
13. Return to your board and confirm that your Jira data is now displaying.

### Import from Trello

This node app converts a Trello ``.json`` archive into a ``.boardarchive`` file. The script imports all cards from a single board, including their list (column) membership, names, and descriptions.

1. From the Trello Board Menu, select **...Show Menu**.
2. Select **More > Print and Export > Export to JSON**.
3. Save the generated file locally, e.g. to ``trello.json``.
4. Open a terminal window on your local machine and clone the focalboard repository to a local directory, e.g. to ``focalboard``: ``git clone https://github.com/mattermost/focalboard focalboard``
5. Navigate to ``focalboard/webapp``.
6. Run ``npm install``.
7. Change directory to ``focalboard/import/trello``.
8. Run ``npm install``.
9. From within the same folder, run ``npx ts-node importTrello.ts -i <path-to-trello.json> -o archive.boardarchive``.
10. In Focalboard, open the board you want to use for the export.
11. Select **Settings > Import archive** and select ``archive.boardarchive``.
12. Select **Upload**.
13. Return to your board and confirm that your Trello data is now displaying.

### Import from Todoist

This node app converts a Todoist ``.json`` archive into a ``.boardarchive`` file.

1. Visit the open source Todoist data export service at https://darekkay.com/todoist-export/.
2. From the **Options** menu, select **Export As > JSON (all data)**.
3. Uncheck the **Archived** option if checked.
4. Select **Authorize and Backup**. This will take you to your Todoist account. Follow the instructions on screen.
5. Note the name and location of the downloaded ``.json`` file.
6. Open a terminal window on your local machine and clone the focalboard repository to a local directory, e.g. to ``focalboard``: ``git clone https://github.com/mattermost/focalboard focalboard``
7. Navigate to ``focalboard/webapp``.
8. Run ``npm install``.
9. Change directory to ``focalboard/import/todoist``.
10. Run ``npm install``.
11. From within the same folder, run ``npx ts-node importTodoist.ts -i <path-to-todoist.json> -o archive.boardarchive``.
12. In Focalboard, open the board you want to use for the export.
13. Select **Settings > Import archive** and select ``archive.boardarchive``.
14. Select **Upload**.
15. Return to your board and confirm that your Todoist data is now displaying.

## Export from Focalboard

You can export your boards data as a CSV file.

1. Select the options menu to the left of the **New** button at the top of any board.
2. Select **Export to CSV**.
3. Import the CSV file to your tool of choice. The CSV file contains all the cards in that board and their associated properties.

**Notes**:

- If you only see a single entry in the CSV export when the board contains multiple cards, you may have a specific card in context when you exported the file because you were performing a card search. If you have searched for a card, and that card is in context, that’s the only card that will be exported into the CSV file. Clear your search and try exporting to CSV again.
- After importing CSV Focalboard data from one Mattermost instance into another (such as during a migration from Mattermost Cloud to self-hosted), card timestamps will be updated based on the import date, and cards won't correctly identify users whose user IDs differ across Mattermost instances.

## Back up your Focalboard data

If you’d like to back up a board, you can export it as an archive file. You can import that board to another Mattermost team within the same Mattermost instance. Exported and imported board archives include all card content such as properties, comments, descriptions, and image attachments.

1. Select the options menu Options icon to the left of the **New** button at the top of the board
2. Select **Export board archive**.
3. Download the archive file.
4. Navigate to the team or channel workspace where you’d like to add the exported board.
5. Select the Gear icon next to your profile picture, then choose **Import archive**. The board you exported will be added to this team or channel workspace.

**Notes**:

- If you're using a version of the Focalboard plugin older than v6.4, backing up a board results in a ``.focalboard`` file, rather than a ``.boardarchive`` file. When importing a board backup, select the **Select all files** option to select ``.focalboard`` files.
- After importing a Focalboard backup from one Mattermost instance into another (such as during a migration from Mattermost Cloud to self-hosted), card timestamps will be updated based on the import date, and cards won't correctly identify users whose user IDs differ across Mattermost instances.
