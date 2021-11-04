---
title: "Installing the latest plugin"
date: "2020-12-15T12:01:23-04:00"
section: "Installing the latest plugin"
weight: 1
---

You can install the latest Focalboard plugin, including developer builds, ahead of the official release using the following steps:

## Enable custom plugins in Mattermost

Follow the steps in the [Mattermost admin guide to enable custom plugins](https://docs.mattermost.com/administration/plugins.html#custom-plugins):
1. Manually set `PluginSettings > EnableUploads` to `true` in your `config.json`
2. Restart the Mattermost server

Download `mattermost-plugin-focalboard.tar.gz` from the latest build or [release](https://github.com/mattermost/focalboard/releases).

Then upload the Focalboard plugin:
1. Navigate to **System Console > Plugins > Plugin Management**
2. Select "Choose File" under "Upload Plugin"
3. Select the `mattermost-plugin-focalboard.tar.gz` file
4. Select "Upload"
5. Once uploaded, select "Enable" under the Focalboard plugin to enable it

## Update your web proxy configuration

Follow the [steps here](../#with-nginx) to configure your web proxy (NGINX, Apache, etc.) to complete the setup.

## Enable Reliable Websockets

The Focalboard plugin requires [the Reliable Websockets feature](https://docs.mattermost.com/configure/configuration-settings.html?highlight=enablereliablewebsockets#enable-reliable-websockets) to be enabled. Check in the Mattermost server configuration that the property `ServiceSettings.EnableReliableWebSockets` is set to `true`. If it's not, enable it, restart the server and reload the clients before using the Focalboard plugin.
