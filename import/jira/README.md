# Jira importer

This node app converts a Jira xml export into a Focalboard archive. To use:
1. Open Jira advanced search, and search for all the items to export
2. Select `Export`, then `Export XML`
3. Save it locally, e.g. to `jira_export.xml`
4. Run `npm install` from within `focalboard/webapp`
5. Run `npm install` from within `focalboard/import/jira`
6. Run `npx ts-node importJira.ts -i <path-to-jira.xml> -o archive.focalboard` (also from within `focalboard/import/jira`)
7. In Focalboard, click `Settings`, then `Import archive` and select `archive.focalboard`

## Import scope

Currently, the script imports each item as a card into a single board. [Contribute code](https://www.focalboard.com/contribute/getting-started/) to expand this.
