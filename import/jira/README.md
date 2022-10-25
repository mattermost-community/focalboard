# Jira importer

This node app converts a Jira xml export into a Focalboard archive. To use:
1. Open Jira advanced search, and search for all the items to export
2. Select `Export`, then `Export XML`
3. Save it locally, e.g. to `jira_export.xml`
4. Run `npm install` from within `focalboard/webapp`
5. Run `npm install` from within `focalboard/import/jira`
6. Run `npx ts-node importJira.ts -i <path-to-jira.xml> -o archive.boardarchive` (also from within `focalboard/import/jira`)
7. In Focalboard, click `Settings`, then `Import archive` and select `archive.boardarchive`

## Import scope and known limitations

Currently, the script imports each item as a card into a single board. Note that Jira XML export is limited to 1000 issues at a time.

Users are imported as Select properties, with the name of the user.

The following aren't currently imported:
* Custom properties
* Comments
* Embedded files

[Contribute code](https://mattermost.github.io/focalboard/) to expand this.
