# CSV importer

This node app converts a CSV into a Focalboard archive. To use:
1. Run `npm install` from within `focalboard/webapp`
2. Run `npm install` from within `focalboard/import/csv`
3. Run `npx ts-node importCsv.ts -i <path to csv> -o archive.boardarchive`
   - If the csv was exported by testrails, pass `-t true` into the command line arguments
4. In Focalboard, click `Settings`, then `Import archive` and select `archive.boardarchive`

## Import scope

Currently, the script imports all cards from a single board, including their properties and markdown content.

The script currently imports all card properties as a Select type. You can change the type after importing into Focalboard.

[Contribute code](https://mattermost.github.io/focalboard/) to expand this.
