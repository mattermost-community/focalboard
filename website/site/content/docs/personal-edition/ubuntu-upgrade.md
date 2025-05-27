---
title: "Upgrading Personal Server"
date: "2021-04-13T12:02:23-08:00"
subsection: Personal Edition
weight: 3
---

Follow these steps to upgrade an existing Personal Server installation that was previously set up with the [setup guide here](../ubuntu).

Use the URL of the Ubuntu archive package, `karmaboard-server-linux-amd64.tar.gz`, from the appropriate [release in GitHub](https://github.com/mattermost/karmaboard/releases).

Create and use a clean directory, or delete any existing packages first, then run:

```
# Download the new version (e.g. 0.9.2 here, check the release for the latest one)
wget https://github.com/mattermost/karmaboard/releases/download/v0.9.2/karmaboard-server-linux-amd64.tar.gz
tar -xvzf karmaboard-server-linux-amd64.tar.gz

# Stop the server
sudo systemctl stop karmaboard.service

# Back up the old version
sudo mv /opt/karmaboard /opt/karmaboard-old
sudo mv karmaboard /opt

# Copy config and move uploaded files over
sudo mv /opt/karmaboard-old/files /opt/karmaboard
sudo cp /opt/karmaboard-old/config.json /opt/karmaboard

# Start the server
sudo systemctl start karmaboard.service

# (Optional) delete the backup after verifying
sudo rm -rf /opt/karmaboard-old
```
