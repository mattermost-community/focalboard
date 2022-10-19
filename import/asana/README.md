# Asana importer

This node app converts an Asana json archive into a Focalboard archive. To use:
1. From the Asana Board Menu (dropdown next to board title), select `Export / Print`, and `JSON`
2. Save it locally, e.g. to `asana.json`
3. Run `npm install` from within `focalboard/webapp`
4. Run `npm install` from within `focalboard/import/asana`
5. Run `npx ts-node importAsana.ts -i <asana.json> -o archive.boardarchive`
6. In Focalboard, click `Settings`, then `Import archive` and select `archive.boardarchive`

## Import scope

Currently, the script imports all cards from a single board, including their section (column) membership, names, and notes. [Contribute code](https://mattermost.github.io/focalboard/) to expand this.
