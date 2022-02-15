---
title: "Focalboard: The road to v1.0"
slug: focalboard-the-road-to-v1
date: 2021-05-13
categories:
    - "roadmap"
author: Chen Lim
github: chenilim
community: chen-i.lim
---

Thank you all so much for the enthusiasm and energy you've shown for Focalboard! To be perfectly honest, your enthusiasm is what enables us, as Mattermost, to direct more resources towards Focalboard. It wouldn't happen without you.

I want to give an update on our current plans for taking Focalboard to a "v1". As it says on the tin, we want Focalboard to be a compelling **open source, self-hosted alternative to Trello, Notion, and Asana**. Our immediate goal is to build out the common features in these reference products, that is, features that "80% of users" care about.

We're not going to stop there of course. One of our main differentiators is going to be **tight integration with Mattermost**. You can check out the [Early Preview of that here](../mattermost-focalboard-early-preview). The immediate benefit of this is gaining the security and access-control systems in Mattermost, e.g. the ability to specify per-workspace permissions.

We anticipate many other integrations over time, e.g.
* [Unfurled card links](https://github.com/mattermost/focalboard/issues/386)
* [Slash commands to create cards](https://github.com/mattermost/focalboard/issues/382)

In addition to that, here is an outline of the other things we anticipate completing before declaring a "v1", based on the goals above, and feedback to date. Standard disclaimers apply - no promises, this is the current plan until the plan changes, and many of these are at the exploratory stage. :)

### Complete / update existing views
* Board view
	* [Export / import board](https://github.com/mattermost/focalboard/issues/261)
	* [Keyboard support](https://github.com/mattermost/focalboard/issues/29)
* Table view
	* [Grouped table / list view](https://github.com/mattermost/focalboard/issues/408)
	* [Keyboard support](https://github.com/mattermost/focalboard/issues/30)
* Gallery view
	* Various bug fixes
* Card view
	* Various bug fixes

### Additional views
* List view
	* Current plan is to extend the Table view to support [groups](https://github.com/mattermost/focalboard/issues/408)
* [Calendar view](https://github.com/mattermost/focalboard/issues/338)
* Pages
	* Basic implementation is the same as the content blocks on a card
	* [Advanced content editor](https://github.com/mattermost/focalboard/issues/166)

### Additional property types
* [Date property](https://github.com/mattermost/focalboard/issues/38)
* [User property](https://github.com/mattermost/focalboard/issues/185)
* [Multi-select properties](https://github.com/mattermost/focalboard/issues/110)

### Additional content types
* [Link to another card](https://github.com/mattermost/focalboard/issues/324)

### Improved sidebar
* [Manual sorting](https://github.com/mattermost/focalboard/issues/299)
* [Keyboard navigation](https://github.com/mattermost/focalboard/issues/28)

### Personal Dashboard
* [Status page](https://github.com/mattermost/focalboard/issues/305)

## We need your feedback!

Continuing to get feedback from you, our community is vital to us. Focalboard (and Mattermost) will continue to be open source projects supported by a vibrant community. We want you to be part of the ongoing conversation. Please continue to keep those [feature ideas](https://github.com/mattermost/focalboard/issues/new/choose), [bug reports](https://github.com/mattermost/focalboard/issues/new/choose), and [other input](https://www.focalboard.com/feedback/) coming.

## Want to contribute?

We’d love your help!

Help shape the future of Focalboard by contributing ideas, bug reports, and code. Check out our [community page](https://mattermost.github.io/focalboard/) or [GitHub repo](https://github.com/mattermost/focalboard) to get started.

You can also browse GitHub tickets with a “[up for grabs](https://github.com/mattermost/focalboard/issues?q=is%3Aissue+is%3Aopen+label%3A%22Up+for+grabs%22)” tag to see what projects are available.

Like what you see? Please consider giving Focalboard a [GitHub Star](https://github.com/mattermost/focalboard)!