FROM ubuntu:20.04

# Make sure that the underlying container is patched to the latest versions
RUN apt-get update && \
    apt-get install -y file gzip tar unzip wget

# Now install Focalboard as a seperate layer
RUN wget https://releases.mattermost.com/focalboard/0.5.0/focalboard-server-linux-amd64.tar.gz && \
    unzip -o focalboard-server-linux-amd64.tar.gz && \
    tar -xvzf focalboard-server-linux-amd64.tar.gz && \
    mv focalboard /opt

EXPOSE 8000

WORKDIR /opt/focalboard

CMD /opt/focalboard/bin/focalboard-server
