# mattermost-octo-tasks

## Building the server

```
cd webapp
npm install
npm run packdev
cd ..
make prebuild
make
```

Currently tested with:
* Go 1.15.2
* MacOS Catalina (10.15.6)
* Ubuntu 18.04

The server defaults to using sqlite as the store, but can be configured to use Postgres:
* In config.json
	* Set dbtype to "postgres"
	* Set dbconfig to the connection string (which you can copy from dbconfig_postgres)
* Create a new "octo" database with psql
* Restart the server

## Running and testing the server

To start the server:
```
./bin/octoserver
```

Server settings are in config.json.

Open a browser to [http://localhost:8000](http://localhost:8000) to start.

## Building and running the macOS app
You can build the Mac app on a Mac running macOS Catalina (10.15.6+) and with Xcode 12.0+. A valid development signing certificate must be available.

First build the server using the steps above, then run:
```
make mac
```

To run, launch mac/dist/Tasks.app
