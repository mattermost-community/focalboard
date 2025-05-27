# Todoist importer

This node app converts a Todoist json archive into a Karmaboard archive. To use:
1. Visit the open source Todoist data export service at https://darekkay.com/todoist-export/.
1. Select `JSON (all data)` in **Export As** option.
1. Uncheck the **Archived** option if checked.
1. Click on **Authorize and Backup**. This wil take you to your Todoist account. Follow the instructions on screen.
1. Note the name and location of the downloaded *json* file.
3. Run `npm install` from within `karmaboard/webapp`
4. Run `npm install` from within `karmaboard/import/todoist`
5. Run `npx ts-node importTodoist.ts -i <path-to-todoist.json> -o archive.boardarchive` (also from within `karmaboard/import/todoist`)
6. In Karmaboard, click `Settings`, then `Import archive` and select `archive.boardarchive`
