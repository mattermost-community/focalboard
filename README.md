# mattermost-octo-tasks

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
* Create a new "octo" database with psql
* Restart the server

## Running and testing the server

To start the server, run `./bin/octoserver`

Server settings are in config.json.

Open a browser to [http://localhost:8000](http://localhost:8000) to start.

## Building and running standalone desktop apps

You can build standalone apps that package the server to run locally against SQLite:

* Mac:
    * `make mac-app`
    * run `mac/dist/Tasks.app`
    * *Requires: macOS Catalina (10.15), Xcode 12 and a development signing certificate.*
* Linux:
    * `make linux-app`
    * run `linux/dist/tasks-app`
* Windows
    * `make win-app`
    * run `win/dist/tasks-win.exe`
    * *Requires: Windows 10*

Cross-compilation currently isn't fully supported, so please build on the appropriate platform.
