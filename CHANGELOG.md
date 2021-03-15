# Focalboard Changelog

Focalboard is an open source, self-hosted alternative to Trello, Notion, Asana and Jira for project management. We help individuals and teams define, organize, track and manage their work.

This changelog summarizes updates to our open source project. You can also find the [latest releases and release notes on GitHub here](https://github.com/mattermost/focalboard/releases).

## v0.6 Release - March 2021

* Focalboard Personal Desktop is now live in the App Stores:
    * [Mac App Store](https://apps.apple.com/app/apple-store/id1556908618?pt=2114704&ct=changelog&mt=8)
    * [Microsoft App Store](https://www.microsoft.com/store/apps/9NLN2T0SX9VF?cid=changelog)
* Added [Windows native app (WPF)](https://github.com/mattermost/focalboard/tree/main/win-wpf) support
* Added [Swagger / OpenAPI definition and documentation](https://htmlpreview.github.io/?https://github.com/mattermost/focalboard/blob/main/server/swagger/docs/html/index.html)
* Added [Import scripts for Trello, Asana, and Notion](https://github.com/mattermost/focalboard/tree/main/import)
* Added [Developer Tips and Tricks article](https://www.focalboard.com/contribute/getting-started/dev-tips/).
* Added Security improvements:
	* [Single-user session token](https://github.com/mattermost/focalboard/commit/0fe96ad7ed3b0c3a68c9a5889b34b764782f9266)
	* [CSRF prevention with X-Requested-With header](https://github.com/mattermost/focalboard/commit/43c656c9a440e12f87b61d66654ed3d9873b1620)

03-04-21
* Added initial changelog.md file
