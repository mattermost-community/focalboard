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

* **[Personal Desktop](https://www.focalboard.com/download/personal-edition/desktop/)**: A standalone, single-user Mac, Windows, or Linux desktop app for your own todos and personal projects.

* **[Mattermost Boards](https://www.focalboard.com/download/mattermost/)**: A self-hosted or cloud server for your team to plan and collaborate.

Focalboard can also be installed as a standalone **[Personal Server](https://www.focalboard.com/download/personal-edition/ubuntu/)** for development and personal use.

## Try Focalboard

### Personal Desktop (Windows, Mac or Linux Desktop)

* **Windows**: Download from the [Windows App Store](https://www.microsoft.com/store/productId/9NLN2T0SX9VF) or download `focalboard-win.zip` from the [latest release](https://github.com/mattermost/focalboard/releases), unpack, and run `Focalboard.exe`.
* **Mac**: Download from the [Mac App Store](https://apps.apple.com/us/app/focalboard-insiders/id1556908618?mt=12).
* **Linux Desktop**: Download `focalboard-linux.tar.gz` from the [latest release](https://github.com/mattermost/focalboard/releases), unpack, and open `focalboard-app`.

### Mattermost Boards

**Mattermost Boards** is the Mattermost plugin version of Focalboard that combines project management tools with messaging and collaboration for teams of all sizes. To access and use **Mattermost Boards**, install or upgrade to Mattermost v6.0 or later as a [self-hosted server](https://docs.mattermost.com/guides/deployment.html?utm_source=focalboard&utm_campaign=focalboard) or [Cloud server](https://mattermost.com/get-started/?utm_source=focalboard&utm_campaign=focalboard). After logging into Mattermost, select the menu in the top left corner and select **Boards**.

***Mattermost Boards** is installed and enabled by default in Mattermost v6.0 and later.*

See the [plugin setup guide](https://www.focalboard.com/download/mattermost/) for more details.

### Personal Server

**Ubuntu**: You can download and run the compiled Focalboard **Personal Server** on Ubuntu by following [our latest install guide](https://www.focalboard.com/download/personal-edition/ubuntu/).

## Contribute to Focalboard

Contribute code, bug reports, and ideas to the future of the Focalboard project. We welcome your input! Please see [CONTRIBUTING](CONTRIBUTING.md) for details on how to get involved.

### Getting started

Our [developer guide](https://developers.mattermost.com/contribute/focalboard/personal-server-setup-guide) has detailed instructions on how to set up your development environment for the **Personal Server**. It also provides more information about contributing to our open source community.

To build the server:

```
make prebuild
make
```

To run the server:

```
 ./bin/focalboard-server
```

Then navigate your browser to [`http://localhost:8000`](http://localhost:8000) to access your Focalboard server. The port is configured in `config.json`.

Once the server is running, you can rebuild just the web app via `make webapp` in a separate terminal window. Reload your browser to see the changes.

### Building and running standalone desktop apps

You can build standalone apps that package the server to run locally against SQLite:

* **Windows**:
    * *Requires Windows 10, [Windows 10 SDK](https://developer.microsoft.com/en-us/windows/downloads/sdk-archive/) 10.0.19041.0, and .NET 4.8 developer pack*
    * Open a `git-bash` prompt.
    * Run `make win-wpf-app`
    * Run `cd win-wpf/msix && focalboard.exe`
* **Mac**:
    * *Requires macOS 11.3+ and Xcode 13.2.1+*
    * `make mac-app`
    * `open mac/dist/Focalboard.app`
* **Linux**:
    * *Tested on Ubuntu 18.04*
    * Install `webgtk` dependencies
        * `sudo apt-get install libgtk-3-dev`
        * `sudo apt-get install libwebkit2gtk-4.0-dev`
    * `make linux-app`
    * Uncompress `linux/dist/focalboard-linux.tar.gz` to a directory of your choice
    * Run `focalboard-app` from the directory you have chosen
* **Docker**:
    * To run it locally from offical image:
        * `docker run -it -p 80:8000 mattermost/focalboard`
    * To build it for your current architecture:
        * `docker build -f docker/Dockerfile .`
    * To build it for a custom architecture (experimental):
        * `docker build -f docker/Dockerfile --platform linux/arm64 .`

Cross-compilation currently isn't fully supported, so please build on the appropriate platform. Refer to the GitHub Actions workflows (`build-mac.yml`, `build-win.yml`, `build-ubuntu.yml`) for the detailed list of steps on each platform.

### Unit testing

Before checking in commits, run `make ci`, which is similar to the `.gitlab-ci.yml` workflow and includes:

* **Server unit tests**: `make server-test`
* **Web app ESLint**: `cd webapp; npm run check`
* **Web app unit tests**: `cd webapp; npm run test`
* **Web app UI tests**: `cd webapp; npm run cypress:ci`

### Translating

Help translate Focalboard! The app is already translated into several languages. We welcome corrections and new language translations! You can add new languages or improve existing translations at [Weblate](https://translate.mattermost.com/engage/focalboard/).

### Staying informed

Are you interested in influencing the future of the Focalboard open source project? Here's how you can get involved:

* **Changes**: See the [CHANGELOG](CHANGELOG.md) for the latest updates
* **GitHub Discussions**: Join the [Developer Discussion](https://github.com/mattermost/focalboard/discussions) board
* **Bug Reports**: [File a bug report](https://github.com/mattermost/focalboard/issues/new?assignees=&labels=bug&template=bug_report.md&title=)
* **Chat**: Join the [Focalboard community channel](https://community.mattermost.com/core/channels/focalboard)
