FROM ubuntu:latest

# Make sure that the underlying container is patched to the latest versions
RUN apt update && \
    apt install -y wget tar gzip unzip file curl

# Now install Focalboard as a seperate layer
RUN	RELEASE=$(curl --silent "https://api.github.com/repos/mattermost/focalboard/releases/latest" | grep -Po '"tag_name": "\K.*?(?=")') && \
	wget https://github.com/mattermost/focalboard/releases/download/$RELEASE/focalboard-server-linux-amd64.tar.gz && \
    tar -xvzf focalboard-server-linux-amd64.tar.gz && \
    mv focalboard /opt

EXPOSE 8000

WORKDIR /opt/focalboard

CMD /opt/focalboard/bin/focalboard-server
