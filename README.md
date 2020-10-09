# mattermost-octo-tasks

## Build instructions

```
make prebuild
make
```

Currently tested with:
* Go 1.15.2
* MacOS Catalina (10.15.6)

The server defaults to using sqlite as the store, but can be configured to use Postgres:
* In config.json
	* Set dbtype to "postgres"
	* Set dbconfig to the connection string (which you can copy from dbconfig_postgres)
* Create a new "octo" database with psql
* Restart the server

## Running and testing

To start the server:
```
./bin/octoserver
```

Server settings are in config.json.

Open a browser to [http://localhost:8000](http://localhost:8000) to start.
