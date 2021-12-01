# Focalboard

![CI Status](https://github.com/mattermost/focalboard/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/mattermost/focalboard/actions/workflows/codeql-analysis.yml/badge.svg)
![Dev Release](https://github.com/mattermost/focalboard/actions/workflows/dev-release.yml/badge.svg)
![Prod Release](https://github.com/mattermost/focalboard/actions/workflows/prod-release.yml/badge.svg)

Like what you see? :eyes: Give us a GitHub Star! :star:

[![Focalboard](website/site/static/img/hero.jpg)](https://www.focalboard.com)

[Focalboard](https://www.focalboard.com) is an open source, self-hosted project management tool that's an alternative to Trello, Notion, and Asana.

It helps define, organize, track and manage work across individuals and teams. Focalboard comes in two main editions:

* **[Personal Desktop](https://www.focalboard.com/download/personal-edition/desktop/)**: A stand-alone single-user Mac, Windows, or Linux desktop app for your todos and personal projects.

* **[Mattermost Boards](https://www.focalboard.com/download/mattermost/)**: A self-hosted or cloud server for your team to plan and collaborate.

Focalboard can also be installed as a standalone [personal server](https://www.focalboard.com/download/personal-edition/ubuntu/) for development and personal use.

## Try out Focalboard

### Focalboard Personal Desktop (Windows, Mac or Linux Desktop)

Try out **Focalboard Personal Desktop** by going to the Windows Store or the Apple AppStore, searching for `Focalboard` and installing to run the compiled version locally.

If you're running a Linux Desktop, [download the latest `focalboard-linux.tar.gz` release](https://github.com/mattermost/focalboard/releases), unpack the `.tar.gz` archive, and open `focalboard-app` from the `focalboard-app` folder.

Note: For Windows and Mac users, while we don't yet offer **Focalboard Personal Desktop** outside of Store-based installs, it is in [consideration for the future](https://github.com/mattermost/focalboard/issues/99) (please upvote the ticket if you're interested in this addition).

### Mattermost Boards

Mattermost Boards combines project management tools with messaging and collaboration for teams of all sizes. To access and use Boards, install or upgrade to Mattermost v6.0 or later as a [self-hosted server](https://docs.mattermost.com/guides/deployment.html?utm_source=focalboard&utm_campaign=focalboard) or [Cloud server](https://mattermost.com/get-started/?utm_source=focalboard&utm_campaign=focalboard). After logging into Mattermost, select the menu in the top left corner of Mattermost and choose **Boards**.

See the [setup guide](https://www.focalboard.com/download/mattermost/) for more details.

### Focalboard Personal Server (Ubuntu)

You can download and run the compiled **Focalboard Personal Server** by following [our latest install guide](https://www.focalboard.com/download/personal-edition/ubuntu/).

Download the latest server release from [GitHub releases](https://github.com/mattermost/focalboard/releases)

## Building the server

Most development can be done on the Personal Server edition. Please refer to the [Developer's Tips & Tricks](https://www.focalboard.com/contribute/getting-started/dev-tips/) for more detailed steps. Here's a summary:

First, install basic dependencies:
* Go 1.15+
* Node 10+ and npm
* Mingw64 on Windows

```
make prebuild
make
```

## Running and testing the server

To start the server, run `./bin/focalboard-server`

Server settings are in config.json (or the path specified with --config).

Open a browser to [http://localhost:8000](http://localhost:8000) to start.

## Building and running standalone desktop apps

You can build standalone apps that package the server to run locally against SQLite:

* Mac:
    * `make mac-app`
    * run `mac/dist/Focalboard.app`
    * *Requires: macOS Catalina (10.15)+, Xcode 12+.*
* Linux:
    * Install webgtk dependencies
        * `sudo apt-get install libgtk-3-dev`
        * `sudo apt-get install libwebkit2gtk-4.0-dev`
    * `make linux-app`
    * run `linux/dist/focalboard-app`
    * *Tested with: Ubuntu 18.04*
* Windows:
    * Open a git-bash prompt
    * `make win-wpf-app`
    * run `cd win-wpf/msix && focalboard.exe`
    * *Requires: Windows 10*
* Docker:
    * To run it localy from Offical Image
    * `docker run -it -p 80:8000 mattermost/focalboard`
    * To Build it for your Current Architekture
    * `docker build -f docker/Dockerfile .`
    * To Build it for a custom Architekture (Expiremental)
    * `docker build -f docker/Dockerfile --platform linux/arm64 .`

Cross-compilation currently isn't fully supported, so please build on the appropriate platform. Refer to the GitHub Actions workflows (build-mac.yml, build-win.yml, build-ubuntu.yml) for the detailed list of steps on each platform.

## Unit tests

Before checking-in commits, run: `make ci`, which is similar to the ci.yml workflow and includes:
* Server unit tests: `make server-test`
* Webapp eslint: `cd webapp; npm run check`
* Webapp unit tests: `cd webapp; npm run test`
* Webapp UI tests: `cd webapp; npm run cypress:ci`

## Stay informed on progress

* **Changelog**: See [CHANGELOG.md](CHANGELOG.md) for the latest updates
* **Developer Discussion**: Join the [Developer Discussion](https://github.com/mattermost/focalboard/discussions) board
* **Chat**: Join the [Focalboard community channel](https://community.mattermost.com/core/channels/focalboard)

## Share your feedback

File bugs, suggest features, join our forum, learn more [here](https://github.com/mattermost/focalboard/wiki/Share-your-feedback)!

## Contributing

Contribute code, bug reports, and ideas to the future of the Focalboard project. We welcome your input! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get involved.
