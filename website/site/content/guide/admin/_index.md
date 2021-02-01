---
title: "Administrator's Guide"
date: "2020-12-15T12:01:23-04:00"
section: "guide"
weight: 3
---

## Personal Server configuration

Personal Server settings are stored in `config.json` and is read when the server is launched. The contents are:

| Key      | Description | Example |
| -----------   | ----------- | ---
| serverRoot    | Root URL of the server    | "http://localhost:8000"
| port          | Server port               | 8000
| dbtype        | Type of database. `sqlite3` or `postgres` | "sqlite3"
| dbconfig      | Database connection string    | postgres://user:pass@localhost/boards?sslmode=disable&connect_timeout=10
| webpath       | Path to web files         | "./webapp/pack"
| filespath     | Path to uploaded files folder | "./files"
| telemetry     | Enable health diagnostics telemetry | true
| session_expire_time | Session expiration time in seconds | 2592000
| session_refresh_time  | Session refresh time in seconds | 18000
| localOnly | Only allow connections from localhost | false
| enableLocalMode | Enable Admin APIs on local Unix port | true
| localModeSocketLocation | Location of local Unix port | "/var/tmp/focalboard_local.socket"


## Resetting passwords

By default, Personal Server exposes admin APIs on a local Unix socket at `/var/tmp/focalboard_local.socket`. This is configurable by the `enableLocalMode` and `localModeSocketLocation` settings in config.json.

To reset a user's password, you can use the following `reset-password.sh` script:

```
#!/bin/bash

if [[ $# < 2 ]] ; then
    echo 'reset-password.sh <username> <new password>'
    exit 1
fi

curl --unix-socket /var/tmp/focalboard_local.socket http://localhost/api/v1/admin/users/$1/password -X POST -H 'Content-Type: application/json' -d '{ "password": "'$2'" }'
```

After resetting a user's password (e.g. if they forgot it), direct them to change it from the user menu, by clicking on their username at the top of the side bar.
