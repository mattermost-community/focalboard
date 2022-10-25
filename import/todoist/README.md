# Todoist importer

This node app converts a Todoist json archive into a Focalboard archive. To use:
1. Visit the open source Todoist data export service at https://darekkay.com/todoist-export/.
1. Select `JSON (all data)` in **Export As** option.
1. Uncheck the **Archived** option if checked.
1. Click on **Authorize and Backup**. This wil take you to your Todoist account. Follow the instructions on screen.
1. Note the name and location of the downloaded *json* file.
3. Run `npm install` from within `focalboard/webapp`
4. Run `npm install` from within `focalboard/import/todoist`
5. Run `npx ts-node importTodoist.ts -i <path-to-todoist.json> -o archive.boardarchive` (also from within `focalboard/import/todoist`)
6. In Focalboard, click `Settings`, then `Import archive` and select `archive.boardarchive`
