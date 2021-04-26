---
title: "Focalboard v0.6.5: Gallery View, Docker install,10 translations and more"
slug: focalboard-v0.6.5-release
date: 2021-04-21
categories:
    - "releases"
author: Chen Lim
github: chenilim
community: chen-i.lim
---

<img src="https://user-images.githubusercontent.com/46905241/115785976-0d071080-a375-11eb-8ee1-59a1e2975686.jpg" />

This is our first-ever release announcement for Focalboard, an open source alternative to Trello, Notion, and Asana.

It's been an incredible month. Not long ago we were at 40 GitHub Stars, and after trending on Hacker News, Reddit and Product Hunt, our open source project is at over 3,200 stars and growing.

Focalboard 0.6.5 is the best release we've ever shipped and it's made possible by so many new contributors to the project.

We can't thank everyone enough for their contributions, each of which makes a last difference in the history of the Focalboard open source project.

We’re so excited to share some highlights:

## Focalboard is now available in DockerHub with over 10,000 Pulls!!!

<img src="https://user-images.githubusercontent.com/46905241/115785989-12645b00-a375-11eb-927d-fe4285dc8b32.png" style="max-height: 300px;" />

Check out Focalboard on Docker Hub at: https://hub.docker.com/r/mattermost/focalboard.

Use Docker? Install Focalboard with one line: `docker pull mattermost/focalboard`

Huge thanks to @jwilander and @obbardc! Plus, thanks to @proffalken for adding a Dockerfile to run service in a container (#76) and to @jbutler992 for adding docker-compose to run the whole service in containers (#105).

## Focalboard is now available in 10 languages!

<img src="https://user-images.githubusercontent.com/46905241/115786018-1a23ff80-a375-11eb-927f-d12988f5ad41.png" style="max-height: 300px;" />

Last month, we had only English and Spanish. This month we’ve added eight new languages: German (Thanks @svelle!); Japanese (Thanks @kaakaa!); French (Thanks @CyrilLD!), Occitan (Thanks Quentin PAGÈS!); Dutch (Thanks Tom De Moor!); Turkish (Thanks Abdullah Musab!); Simplified Chinese (Thanks Yao Xie and toto6038!); and Russian (Thanks Edward Smirnov!).

Thanks to everyone for making Focalboard an inclusive, international community from the very start of the project.

## Translations contributions can now be made at translate.mattermost.com

<img src="https://user-images.githubusercontent.com/46905241/115786040-227c3a80-a375-11eb-8299-1e337e9100a8.png" style="max-height: 300px;" />

Thanks to @jespino, anyone can now go to https://translate.mattermost.com/ to contribute language translations to the project!

## New “Gallery View”

<img src="https://user-images.githubusercontent.com/46905241/115786031-1f814a00-a375-11eb-8178-c62c05f928db.png" style="max-height: 300px;" />

Focalboard 0.6.5 gives you more flexibility in organizing tickets with a new “Gallery View” which displays tickets with image elements in a neat rectangularly formatted grid.

Just like existing Kanban Board and Table Views, you can customize your new Gallery Views to filter, sort, and display different properties, plus search through the content.

## New Checkbox Content Type

<img src="https://user-images.githubusercontent.com/46905241/115786054-28721b80-a375-11eb-8720-fea7e7c0dcf1.png" style="max-height: 300px;" />

Focalboard 0.6.5 makes tickets even more versatile by adding a new “checkbox” property type option.

Just like text, number, email, URL, and selection list types, you can add the new checkbox property to tickets within a grid, as well as in templates.

## Shortcuts and Infrastructure

Focalboard 0.6.5 also includes a new keyboard shortcut for search (CTRL+SHIFT+F) and duplicating selected cards (CTRL+D).

Also many thanks to @renjithgr for contributing more frontend unit test coverage (#126) and adding an email property type (#84).

## Want to try the latest release?

Here’s now how to start with different editions:

**Personal Desktop Edition** - A standalone desktop app for your todos and personal projects
* **Mac App Store**: Download or upgrade from the [Mac App Store](https://apps.apple.com/app/apple-store/id1556908618?pt=2114704&ct=website&mt=8)
* **Microsoft Store**: Download from the [Microsoft Store](https://www.microsoft.com/store/apps/9NLN2T0SX9VF?cid=website)
* **Windows Install**: Download `focalboard-win.zip` from the [release](https://github.com/mattermost/focalboard/releases)
* **Linux Desktop Install**: Download `focalboard-linux.tar.gz` from the [release](https://github.com/mattermost/focalboard/releases)

**Personal Server Edition** - A self-hosted server for your team to collaborate
* **Linux Server Install**: See the [setup](../../download/personal-edition/ubuntu/) or [upgrade guide](../../download/personal-edition/ubuntu-upgrade/).
* **Docker Install**: See the [docker install guide](../../download/personal-edition/docker/)

See the [download page for more details](../../download/personal-edition/).

## Want to contribute?

We’d love your help!

Help shape the future of Focalboard by contributing ideas, bug reports, and code. Check out our community page or GitHub repo to get started.

You can also browse GitHub tickets with a “help wanted” tag to see what projects are available.

Like what you see? Please consider giving Focalboard a GitHub Star!
