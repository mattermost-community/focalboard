# Deploy Focalboard with Docker

## Docker

The Dockerfile gives a quick and easy way to pull the latest Focalboard server and deploy it locally.
Please note that if you wish to have persistence and mount a volume for the `/data` directory, the host directory must be owned by user `nobody`.
To do this run 'sudo chown -R nobody /home/user/focalboard-data' to grant the SQL Database Write Access

Execute from the Root Directory of this Repository to Build it for your Current Architecture:
```
docker build -f docker/Dockerfile -t focalboard .
```
To Build it for a custom Architecture (Experimental)
```
docker build -f docker/Dockerfile --platform linux/arm64 .
```

Execute for Running the Container
```
docker run -it  -v "/home/user/focalboard-data:/data" \
                -v "/home/user/focalboard-config:/config" \
                -p 80:8000 focalboard 
```

> The `-v` flag can be used to store Focalboard's config file and database and uploaded files in a directory on the Docker host
> When you use the Bind Mount for the Config Folder, be Aware that you need to Put a Valid Config File in the Specified Directory on the Host
> A Valid Config File can be found under: [Config File](server_config.json)

Open a browser to http://localhost after you Started your Container to see it Running

## Docker-Compose

Docker-Compose provides the option to automate the build and run step, or even include some of the steps from the [personal server setup](https://www.focalboard.com/download/personal-edition/ubuntu/).

To start the server run

```
docker-compose up
```

This will automatically build the focalboard image and start it with the http port mapping.

To run focalboard with a nginx proxy and a postgres backend run

```
docker-compose -f docker-compose-db-nginx.yml up
```
