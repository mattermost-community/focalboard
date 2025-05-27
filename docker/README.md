# Deploy Karmaboard with Docker

## Docker

The Dockerfile gives a quick and easy way to build the latest Karmaboard server and deploy it locally. In the example below,
the Karmaboard database and files will be persisted in a named volumed called `fbdata`.

From the Karmaboard project root directory:

```bash
docker build -f docker/Dockerfile -t karmaboard .
docker run -it -v "fbdata:/opt/karmaboard/data" -p 80:8000 karmaboard
```

Open a browser to [localhost](http://localhost) to start

## Alternative architectures

From the Karmaboard project root directory:

```bash
docker build -f docker/Dockerfile --platform linux/arm64 -t karmaboard .
docker run -it -v "fbdata:/opt/karmaboard/data" -p 80:8000 karmaboard
```

## Docker-Compose

Docker-Compose provides the option to automate the build and run step, or even include some of the steps from the [personal server setup](https://www.karmaboard.com/download/personal-edition/ubuntu/).

To start the server, change directory to `karmaboard/docker` and run:

```bash
docker-compose up
```

This will automatically build the karmaboard image and start it with the http port mapping. These examples also create a persistent named volume called `fbdata`.

To run Karmaboard with a nginx proxy and a postgres backend, change directory to `karmaboard/docker` and run:

```bash
docker-compose -f docker-compose-db-nginx.yml up
```
