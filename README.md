# Focalboard

[![Focalboard](website/site/static/img/hero.jpg)](http://www.focalboard.com)

[Focalboard](http://www.focalboard.com) is an open source project management app for individuals and teams. It comes in two editions:
* **Personal Desktop**: A stand-alone desktop app for your todos and personal projects
* **Personal Server**: A self-hosted server for your team to collaborate

The same server binary powers both editions.

## Building the server

```
make prebuild
make
```

Currently tested with:
* Go 1.15.2
* MacOS Catalina (10.15.6)
* Ubuntu 18.04
* Windows 10

The server defaults to using SQLite as the store, but can be configured to use Postgres:
* In config.json
	* Set dbtype to "postgres"
	* Set dbconfig to the connection string (which you can copy from dbconfig_postgres)
* Create a new "focalboard" database with psql
* Restart the server

## Running and testing the server

To start the server, run `./bin/focalboard-server`

Server settings are in config.json.

Open a browser to [http://localhost:8000](http://localhost:8000) to start.

## Building and running standalone desktop apps

You can build standalone apps that package the server to run locally against SQLite:

* Mac:
    * `make mac-app`
    * run `mac/dist/Focalboard.app`
    * *Requires: macOS Catalina (10.15), Xcode 12 and a development signing certificate.*
* Linux:
    * Install webgtk dependencies
        * `sudo apt-get install libgtk-3-dev`
        * `sudo apt-get install libwebkit2gtk-4.0-dev`
    * `make linux-app`
    * run `linux/dist/focalboard-app`
* Windows
    * `make win-app`
    * run `win/dist/focalboard.exe`
    * *Requires: Windows 10*

Cross-compilation currently isn't fully supported, so please build on the appropriate platform. Refer to the GitHub Actions workflows (build-mac.yml, build-win.yml, build-ubuntu.yml) for the detailed list of steps on each platform.

## Unit tests

Before checking-in commits, run: `make ci`, which is simlar to the ci.yml workflow and includes:
* Server unit tests: `make server-test`
* Webapp eslint: `cd webapp; npm run check`
* Webapp unit tests: `cd webapp; npm run test`
* Webapp UI tests: `cd webapp; npm run cypress:ci`
