# Deploy Focalboard with Docker

## Docker

The Dockerfile gives a quick and easy way to pull the latest Focalboard server and deploy it locally.

```
docker build -t focalboard .
docker run -it -v "/home/user/focalboard-data:/data" -p 80:8000 focalboard
```

> The `-v` flag can be used to store Focalboard's database and uploaded files in a directory on the Docker host

Open a browser to http://localhost to start

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
