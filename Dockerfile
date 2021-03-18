FROM ubuntu:bionic

#Locale
ENV LANG C.UTF-8

ENV DEBIAN_FRONTEND=noninteractive

ENV GOLANG_VERSION="1.16.2"

ENV NODE_VERSION="15"

# Install needed packages and clean up.
RUN apt-get update \
	&& apt-get install -y curl wget git make gcc g++ ca-certificates --no-install-recommends \
    # Go installation
	&& wget https://golang.org/dl/go${GOLANG_VERSION}.linux-amd64.tar.gz \
	&& tar -xvf go${GOLANG_VERSION}.linux-amd64.tar.gz \
    && mv go /usr/local \
    # node installation
    && curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs --no-install-recommends

ENV PATH "$PATH:/usr/local/go/bin"

RUN  git clone https://github.com/mattermost/focalboard.git

WORKDIR /focalboard

RUN make prebuild && make \
	# Clean Up
	&& apt-get autoremove -y \
	&& apt-get clean -y \
	&& rm -rf /var/lib/apt/lists/*

CMD ["./bin/focalboard-server"]
