# Notion importer

This node app converts a Notion CSV and markdown export into a Focalboard archive. To use:
1. From a Notion Board, open the ... menu at the top right
2. Select `Export`, pick `Markdown & CSV` as the export format, select true to include subpages.
3. Save it locally, and unzip the folder e.g. to `notion-export`
4. Run `npm install` from within `focalboard/webapp`
5. Run `npm install` from within `focalboard/import/notion`
6. Run `npx ts-node importNotion.ts -i <path to the notion-export folder> -o archive.boardarchive`
7. In Focalboard, click `Settings`, then `Import archive` and select `archive.boardarchive`

## Import scope

Currently, the script imports all cards from a single board, including their properties and markdown content.

The Notion export format does not preserve property types, so the script currently imports all card properties as a Select type. You can change the type after importing into Focalboard.

[Contribute code](https://mattermost.github.io/focalboard/) to expand this.
