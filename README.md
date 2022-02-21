# Focalboard

![CI Status](https://github.com/mattermost/focalboard/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/mattermost/focalboard/actions/workflows/codeql-analysis.yml/badge.svg)
![Dev Release](https://github.com/mattermost/focalboard/actions/workflows/dev-release.yml/badge.svg)
![Prod Release](https://github.com/mattermost/focalboard/actions/workflows/prod-release.yml/badge.svg)
<a href="https://translate.mattermost.com/engage/focalboard/">
<img src="https://translate.mattermost.com/widgets/focalboard/-/svg-badge.svg" alt="Translation status" />
</a>

Like what you see? :eyes: Give us a GitHub Star! :star:

[![Focalboard](website/site/static/img/hero.jpg)](https://www.focalboard.com)

[Focalboard](https://www.focalboard.com) is an open source, multilingual, self-hosted project management tool that's an alternative to Trello, Notion, and Asana.

It helps define, organize, track and manage work across individuals and teams. Focalboard comes in two main editions:

* **[Personal Desktop](https://www.focalboard.com/download/personal-edition/desktop/)**: A stand-alone single-user Mac, Windows, or Linux desktop app for your todos and personal projects.

* **[Mattermost Boards](https://www.focalboard.com/download/mattermost/)**: A self-hosted or cloud server for your team to plan and collaborate.

Focalboard can also be installed as a standalone [personal server](https://www.focalboard.com/download/personal-edition/ubuntu/) for development and personal use.

## Try out Focalboard

### Focalboard Personal Desktop (Windows, Mac or Linux Desktop)

Try out the single-user **Focalboard Personal Desktop**:
* macOS: Download from the [Mac App Store](https://apps.apple.com/us/app/focalboard-insiders/id1556908618?mt=12).
* Windows: Download from the [Windows App Store](https://www.microsoft.com/store/productId/9NLN2T0SX9VF) or download `focalboard-win.zip` from the [latest release](https://github.com/mattermost/focalboard/releases), unpack, and run `Focalboard.exe`
* Linux Desktop: Download `focalboard-linux.tar.gz` from the [latest release](https://github.com/mattermost/focalboard/releases), unpack, and open `focalboard-app`

### Mattermost Boards

Mattermost Boards combines project management tools with messaging and collaboration for teams of all sizes. To access and use Boards, install or upgrade to Mattermost v6.0 or later as a [self-hosted server](https://docs.mattermost.com/guides/deployment.html?utm_source=focalboard&utm_campaign=focalboard) or [Cloud server](https://mattermost.com/get-started/?utm_source=focalboard&utm_campaign=focalboard). After logging into Mattermost, select the menu in the top left corner of Mattermost and choose **Boards**.

See the [setup guide](https://www.focalboard.com/download/mattermost/) for more details.

### Focalboard Personal Server (Ubuntu)

You can download and run the compiled **Focalboard Personal Server** by following [our latest install guide](https://www.focalboard.com/download/personal-edition/ubuntu/).

Download the latest server release from [GitHub releases](https://github.com/mattermost/focalboard/releases)

## Building the server

Most development can be done on the Personal Server edition. Please refer to the [Developer's Tips & Tricks](https://mattermost.github.io/focalboard/dev-tips) for more detailed steps. Here's a summary:

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
    * *Requires: macOS 11.3+, Xcode 13.2.1+*
* Linux:
    * Install webgtk dependencies
        * `sudo apt-get install libgtk-3-dev`
        * `sudo apt-get install libwebkit2gtk-4.0-dev`
    * `make linux-app`
    * uncompress `linux/dist/focalboard-linux.tar.gz` to a directory of your choice
    * run `focalboard-app` from the directory you have chosen
    * *Tested with: Ubuntu 18.04*
* Windows:
    * Open a git-bash prompt
    * `make win-wpf-app`
    * run `cd win-wpf/msix && focalboard.exe`
    * *Requires: Windows 10, [Windows 10 SDK](https://developer.microsoft.com/en-us/windows/downloads/sdk-archive/) 10.0.19041.0, .NET 4.8 developer pack*
* Docker:
    * To run it locally from Offical Image
    * `docker run -it -p 80:8000 mattermost/focalboard`
    * To Build it for your Current Architecture
    * `docker build -f docker/Dockerfile .`
    * To Build it for a custom Architecture (Experimental)
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

## Translating

Help translate Focalboard! The app is already translated into several languages. We welcome corrections and new language translations! You can add new languages or improve existing translations at [Weblate](https://translate.mattermost.com/engage/focalboard/).
