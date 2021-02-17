# Trello importer

This node app converts a Trello json archive into a Focalboard archive. To use:
1. From the Trello Board Menu, select `More`, then `Print and Export`, and `Export to JSON`
2. Save it locally, e.g. to `trello.json`
3. Run `npm install`
4. Run `npx ts-node importTrello.ts -i <trello.json> -o archive.focalboard`
5. In Focalboard, click `Settings`, then `Import archive` and select `archive.focalboard`

## Import scope

Currently, the script imports all cards from a single board, including their list (column) membership, names, and descriptions. [Contribute code](https://www.focalboard.com/contribute/getting-started/) to expand this.


