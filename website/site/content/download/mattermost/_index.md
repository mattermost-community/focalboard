---
title: "Mattermost"
date: "2020-12-15T12:01:23-04:00"
section: "download"
weight: 2
---

Focalboard is installed with Mattermost v6.0, where is it named Boards. Install or upgrade to Mattermost v6.0 or later, click on the menu at the top left, and select Boards to open it.

No additional server or web-proxy configuration is required.

### Enable Shared Boards

The shared boards feature is disabled by default in Mattermost. To enable it:

1. Open the System Console
2. Select Mattermost Boards under Plugins
3. Turn on the setting for "Enable Publicly-Shared Boards"

### Permissions

Mattermost Boards currently uses channel-based permissions, meaning that only members of the associated channel can access (read / write) the boards for that channel.

You can use this to create private boards:
1. Create or join a private channel (or group channel or direct-message)
2. Click on the Focalboard icon in the channel header
3. Create a board

Only members of that private channel can access the board.

You can use the [share board](/guide/user/#sharing-boards) feature to share a read-only board with anyone (incuding unauthenticated users) who has the generated link.

For more information of using Mattermost Boards, refer to the main [product documentation here](https://docs.mattermost.com/guides/boards.html).
