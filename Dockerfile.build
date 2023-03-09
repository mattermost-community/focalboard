# This Dockerfile is used to build Focalboard for Linux. It builds all the parts inside the image
# and the last stage just holds the package which is then copied back to the host.
#
# docker buildx build -f Dockerfile.build --no-cache --platform linux/amd64 -t focalboard-build:dirty --output out .
# docker buildx build -f Dockerfile.build --no-cache --platform linux/arm64 -t focalboard-build:dirty --output out .
#
# Afterwards the packages can be found in the ./out folder.

# build frontend
FROM node:16.3.0@sha256:ca6daf1543242acb0ca59ff425509eab7defb9452f6ae07c156893db06c7a9a4 AS frontend

WORKDIR /webapp
COPY webapp .

### 'CPPFLAGS="-DPNG_ARM_NEON_OPT=0"' Needed To Avoid Bug Described in: https://github.com/imagemin/optipng-bin/issues/118#issuecomment-1019838562
### Can be Removed when Ticket will be Closed
RUN CPPFLAGS="-DPNG_ARM_NEON_OPT=0" npm install --no-optional && \
    npm run pack

# build backend and package
FROM golang:1.18.3@sha256:b203dc573d81da7b3176264bfa447bd7c10c9347689be40540381838d75eebef AS backend

COPY . .
COPY --from=frontend /webapp/pack webapp/pack

ARG TARGETARCH

# RUN apt-get update && apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev -y
RUN EXCLUDE_PLUGIN=true EXCLUDE_SERVER=true EXCLUDE_ENTERPRISE=true make server-linux arch=${TARGETARCH}
RUN make server-linux-package-docker arch=${TARGETARCH}

# Copy package back to host
FROM scratch AS dist
ARG TARGETARCH
COPY --from=backend /go/dist/focalboard-server-linux-${TARGETARCH}.tar.gz .
