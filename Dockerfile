FROM ubuntu:latest

RUN apt update 
RUN apt upgrade -y
RUN apt install -y wget tar gzip unzip file
RUN wget https://releases.mattermost.com/focalboard/0.5.0/focalboard-server-linux-amd64.tar.gz
RUn unzip -o focalboard-server-linux-amd64.tar.gz
RUN tar -xvzf focalboard-server-linux-amd64.tar.gz
RUN mv focalboard /opt

EXPOSE 8000

WORKDIR /opt/focalboard

CMD /opt/focalboard/bin/focalboard-server
