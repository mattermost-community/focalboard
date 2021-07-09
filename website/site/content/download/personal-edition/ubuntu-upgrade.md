---
title: "Upgrading Personal Server"
date: "2021-04-13T12:02:23-08:00"
subsection: Personal Edition
weight: 3
---

Follow these steps to upgrade an existing Personal Server installation that was previously set up with the [setup guide here](../ubuntu).

Use the URL of the Ubuntu archive package, `focalboard-server-linux-amd64.tar.gz`, from the appropriate [release in GitHub](https://github.com/mattermost/focalboard/releases).

Create and use a clean directory, or delete any existing packages first, then run:

```
# Download the new version (e.g. 0.7.0 here, check the release for the latest one)
wget https://github.com/mattermost/focalboard/releases/download/v0.7.0/focalboard-server-linux-amd64.tar.gz
tar -xvzf focalboard-server-linux-amd64.tar.gz

# Stop the server
sudo systemctl stop focalboard.service

# Back up the old version
sudo mv /opt/focalboard /opt/focalboard-old
sudo mv focalboard /opt

# Copy config and move uploaded files over
sudo mv /opt/focalboard-old/files /opt/focalboard
sudo cp /opt/focalboard-old/config.json /opt/focalboard

# Start the server
sudo systemctl start focalboard.service

# (Optional) delete the backup after verifying
sudo rm -rf /opt/focalboard-old
```
