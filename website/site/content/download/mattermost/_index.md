---
title: "Mattermost"
date: "2020-12-15T12:01:23-04:00"
section: "download"
weight: 2
---

Focalboard is installed with Mattermost v6.0, where it's called Boards. To access and use Boards, [install or upgrade to Mattermost v6.0 or later](https://mattermost.com/get-started/). Then, select the Product menu in the top left corner of Mattermost and choose **Boards**.

No additional server or web-proxy configuration is required.

### Enable shared boards

The shared boards feature is disabled by default in Mattermost. To enable it:

1. Open the System Console.
2. Go to **Plugins** and select Mattermost Boards.
3. Set **Enable Publicly-Shared Boards** to **true**.
4. Choose **Save**.

### Permissions

Mattermost Boards currently uses channel-based permissions, meaning that only members of the associated channel can access (read/write) the boards for that channel.

You can use this to create private boards:

Create or join a Private channel, Group Message, or Direct Message. Then, select the Boards icon in the channel header to create a board. Only members of the Private channel, Group Message, or Direct Message can access the board.

You can use the [share board](/guide/user/#sharing-boards) feature to share a read-only board with anyone (incuding unauthenticated users) who has the generated link.

For more information about using Mattermost Boards, refer to the main [product documentation here](https://docs.mattermost.com/guides/boards.html).
