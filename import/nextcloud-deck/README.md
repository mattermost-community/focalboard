# Nextcloud Deck importer

This node app converts data from a Nextcloud Server with the [app Deck](https://apps.nextcloud.com/apps/deck) installed into a Karmaboard archive. To use:

1. Run `npm install` from within `karmaboard/webapp`
2. Run `npm install` from within `karmaboard/import/nextcloud-deck`
3. Run `npx ts-node importDeck.ts -o archive.boardarchive` (also from within `karmaboard/import/nextcloud-deck`)
   1. Enter URL and credentials (can also be provided via cli arguments)
   2. Enter ID of the board to convert
4. In Karmaboard, click `Settings`, then `Import archive` and select `archive.boardarchive`

## Import scope

Currently, the script imports all cards from a single board, including their stacks (column) membership, labels, names, descriptions, duedate and comments. [Contribute code](https://mattermost.github.io/karmaboard/) to expand this.


