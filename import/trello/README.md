# Trello importer

This node app converts a Trello json archive into a Focalboard archive. To use:
1. From the Trello Board Menu, `...Show Menu` on right
2. Select `More`, then `Print and Export`, and `Export to JSON`
3. Save it locally, e.g. to `trello.json`
4. Run `npm install` from within `focalboard/webapp`
5. Run `npm install` from within `focalboard/import/trello`
6. Run `npx ts-node importTrello.ts -i <path-to-trello.json> -o archive.boardarchive` (also from within `focalboard/import/trello`)
7. In Focalboard, click `Settings`, then `Import archive` and select `archive.boardarchive`

## Import scope

Currently, the script imports all cards from a single board, including their list (column) membership, names, and descriptions. [Contribute code](https://mattermost.github.io/focalboard/) to expand this.


