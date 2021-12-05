# deploy/
## docker-compose.yml
The example docker-compose.yml in this directory will pull the latest image from DockerHub (you can also specify a specific build if necessary). 

## focalboard_sqlite3_config.json
An example configuration file has been provided as well. If you wish to override defaults, you'll need to make any changes necessary, and then uncomment the following line in `docker-compose.yml`

`- "./focalboard_sqlite3_config.json:/opt/focalboard/config.json/"`
