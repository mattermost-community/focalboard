# Focalboard Plugin Developer's Guide

**Important**: Effective September 15th, 2023, Mattermost Boards transitions to being fully community supported as the Focalboard Plugin. Mattermost will no longer be maintaining this plugin - this includes bug fixes and feature additions. Instead, the plugin is open-sourced and made available indefinitely for community contributions in GitHub.

To build your own version of it:
1. Build [mattermost-plugin](https://github.com/mattermost/focalboard/tree/main/mattermost-plugin) in the [Focalboard repo](https://github.com/mattermost/focalboard)
2. Upload it as a [custom plugin to your Mattermost server](https://developers.mattermost.com/integrate/admin-guide/admin-plugins-beta/#custom-plugins)

Here are the steps in more detail:

### Building the Focalboard plugin

Fork the [Focalboard repo](https://github.com/mattermost/focalboard), clone it locally, and follow the steps in the readme to set up your dev environment.

Install dependencies:
```
# First-time setup dependencies
cd mattermost-plugin/webapp
npm install --no-optional
cd ../..
make prebuild
```

Build the plugin:
```
# Build webapp
make webapp

# Build plugin
cd mattermost-plugin
make dist
```

Refer to the [dev-release.yml](https://github.com/mattermost/focalboard/blob/main/.github/workflows/dev-release.yml#L168) workflow for the up-to-date commands that are run as part of CI.

### Uploading the plugin to your server

You can manually upload the plugin to your Mattermost Server:
1. Enable [custom plugins](https://developers.mattermost.com/integrate/admin-guide/admin-plugins-beta/#custom-plugins) by setting `PluginSettings > EnableUploads` to `true` in the Mattermost `config.json` file
2. Navigate to **System Console > Plugins > Management** and upload the generated `.tar.gz` package in your `mattermost-plugin/dist` directory
3. Enable it (if needed)

Alternatively, you can install Mattermost locally and use `make deploy` to auto-deploy it for you:

First, build and run Mattermost locally:
1. Follow the [Mattermost Developers Guide](https://developers.mattermost.com/contribute/server/developer-setup/) to set up your environment
  * In particuler, make sure Docker is set up and running
2. Fork [mattermost-webapp](https://github.com/mattermost/mattermost-webapp), clone it locally, and `make build`
3. Fork [mattermost-server](https://github.com/mattermost/mattermost-server) and clone it locally
3. Run `make config-reset` to generate the `config/config.json` file
4. Edit `config/config.json`:
  * Set `ServiceSettings > SiteURL` to `http://localhost:8065` ([docs](https://docs.mattermost.com/configure/configuration-settings.html#site-url))
  * Set `ServiceSettings > EnableLocalMode` to `true` ([docs](https://docs.mattermost.com/configure/configuration-settings.html#enable-local-mode))
  * Set `PluginSettings > EnableUploads` to `true` ([docs](https://developers.mattermost.com/integrate/admin-guide/admin-plugins-beta/#custom-plugins))
5. Add an ENV var `MM_SERVICESETTINGS_SITEURL` with the same site URL used in the config
6. Run `make run-server` in Mattermost

Now, to build and deploy the plugin:
1. Clone / fork [mattermost/focalboard](https://github.com/mattermost/focalboard)
2. Install the dependencies (see above)
3. Run:
```
make webapp
cd mattermost-plugin
make deploy
```
