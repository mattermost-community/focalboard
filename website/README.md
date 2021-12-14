# Focalboard website

This folder is used to manage the website at [focalboard.com](https://www.focalboard.com/). It was built using [Hugo](https://gohugo.io/).

- The main page for https://focalboard.com can be found at [/site/layouts/partials/hero.htm](site/layouts/partials).
- Other content can be found in the [/site/content](site/content) folder.

## How to contribute

The documentation for Focalboard (known as Boards in Mattermost) has moved to the [Mattermost Product Documentation](https://docs.mattermost.com/guides/boards.html) site.

We welcome pull requests for typos, minor corrections, content additions, troubleshooting tips, install guides, and any other incremental improvements. If you have any questions about the contribution process, take a look at the [README](https://github.com/mattermost/docs/blob/master/README.md) file or join the [Documentation Working Group channel](https://community.mattermost.com/core/channels/dwg-documentation-working-group) on our Community server.

For larger changes, such as adding an install guide for a different platform, please create a [feature request](https://github.com/mattermost/focalboard/issues/new?assignees=&labels=enhancement&template=enhancement.md&title=Feature+Request%3A+) ticket to discuss.

## How to build locally

If you're interested in building the website locally from this repo using Hugo, please use the following steps:

1. Follow [Hugo documentation](https://gohugo.io/getting-started/installing/) to install Hugo

```bash
# Eg. for Mac OS X
brew install hugo
```


2. Start the development server

```bash
make run
```

3. Go to http://localhost:1313 to see the running server
