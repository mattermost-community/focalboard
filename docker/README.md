# Deploy Focalboard with Docker

## Docker

The Dockerfile gives a quick and easy way to build the latest Focalboard server and deploy it locally. In the example below,
the Focalboard database and files will be persisted in a named volumed called `fbdata`.

From the Focalboard project root directory:

```bash
docker build -f docker/Dockerfile -t focalboard .
docker run -it -v "fbdata:/opt/focalboard/data" -p 80:8000 focalboard
```

Open a browser to [localhost](http://localhost) to start

## Alternative architectures

From the Focalboard project root directory:

```bash
docker build -f docker/Dockerfile --platform linux/arm64 -t focalboard .
docker run -it -v "fbdata:/opt/focalboard/data" -p 80:8000 focalboard
```

## Docker-Compose

Docker-Compose provides the option to automate the build and run step, or even include some of the steps from the [personal server setup](https://www.focalboard.com/download/personal-edition/ubuntu/).

To start the server, change directory to `focalboard/docker` and run:

```bash
docker-compose up
```

This will automatically build the focalboard image and start it with the http port mapping. These examples also create a persistent named volume called `fbdata`.

To run Focalboard with a nginx proxy and a postgres backend, change directory to `focalboard/docker` and run:

```bash
docker-compose -f docker-compose-db-nginx.yml up
```
