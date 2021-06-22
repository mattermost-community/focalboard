FROM golang:alpine as gobuild

RUN apk update && \
    apk add ca-certificates gcc git make musl-dev && \
    git clone https://github.com/mattermost/focalboard && \
    cd focalboard && \
    make server-linux

FROM node:alpine as nodebuild

RUN apk update && \
    apk add ca-certificates git && \
    git clone https://github.com/mattermost/focalboard && \
    cd focalboard/webapp && \
    npm install && npm run pack

FROM alpine:latest

ARG PUID=2000
ARG PGID=2000

EXPOSE 8000/tcp 9092/tcp

VOLUME /data

RUN addgroup -g ${PGID} focalboard && \
    adduser -H -D -u ${PUID} -G focalboard focalboard

WORKDIR /opt/focalboard

COPY --from=gobuild /go/focalboard/bin/linux/focalboard-server bin/
COPY --from=nodebuild /focalboard/webapp/pack pack/
COPY --from=nodebuild /focalboard/LICENSE.txt LICENSE.txt
COPY --from=nodebuild /focalboard/docker/server_config.json config.json

RUN chown -R ${PUID}:${PGID} /opt/focalboard

USER focalboard

CMD ["/opt/focalboard/bin/focalboard-server"]
