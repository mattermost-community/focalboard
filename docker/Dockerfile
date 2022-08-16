### Webapp build
FROM node:16.3.0@sha256:ca6daf1543242acb0ca59ff425509eab7defb9452f6ae07c156893db06c7a9a4 as nodebuild

WORKDIR /webapp
ADD webapp/ /webapp

RUN npm install --no-optional && \
    npm run pack

### Go build
FROM golang:1.18.3@sha256:b203dc573d81da7b3176264bfa447bd7c10c9347689be40540381838d75eebef AS gobuild

WORKDIR /go/src/focalboard
ADD . /go/src/focalboard


RUN  EXCLUDE_PLUGIN=true EXCLUDE_SERVER=true EXCLUDE_ENTERPRISE=true make server-linux
RUN mkdir /data

## Final image
FROM gcr.io/distroless/base-debian10@sha256:d2ce069a83a6407e98c7e0844f4172565f439dab683157bf93b6de20c5b46155

WORKDIR /opt/focalboard

COPY --from=gobuild --chown=nobody:nobody /data /data
COPY --from=nodebuild --chown=nobody:nobody /webapp/pack pack/
COPY --from=gobuild --chown=nobody:nobody /go/src/focalboard/bin/linux/focalboard-server bin/
COPY --from=gobuild --chown=nobody:nobody /go/src/focalboard/LICENSE.txt LICENSE.txt
COPY --from=gobuild --chown=nobody:nobody /go/src/focalboard/docker/server_config.json config.json

USER nobody

EXPOSE 8000/tcp

EXPOSE 8000/tcp 9092/tcp

VOLUME /data

CMD ["/opt/focalboard/bin/focalboard-server"]
