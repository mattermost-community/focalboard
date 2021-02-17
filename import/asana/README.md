# Asana importer

This node app converts a Trello json archive into a Focalboard archive. To use:
1. From the Asana Board Menu, select `Export / Print`, and `JSON`
2. Save it locally, e.g. to `asana.json`
3. Run `npm install`
4. Run `npx ts-node importAsana.ts -i <asana.json> -o archive.focalboard`
5. In Focalboard, click `Settings`, then `Import archive` and select `archive.focalboard`

## Import scope

Currently, the script imports all cards from a single board, including their section (column) membership, names, and notes. [Contribute code](https://www.focalboard.com/contribute/getting-started/) to expand this.
