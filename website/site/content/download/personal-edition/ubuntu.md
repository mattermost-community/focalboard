---
title: "Personal Server (Ubuntu)"
date: "2020-12-15T12:02:23-04:00"
subsection: Personal Edition
weight: 2
---

Matterdeck Personal Server allows your team to work together on shared project boards.

Follow these steps it up on an Ubuntu server.

## Set up Ubuntu Server 18.04

Popular hosted options include:
* [Digital Ocean](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-18-04)
* [Amazon EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html)

## Install Matterdeck

[Download the Ubuntu archive package here](/download), then unpack it to /opt/octo:

```
tar -xvzf octo-linux-amd64.tar.gz
sudo mv octo /opt
```

## Install NGINX

By default, the Matterdeck server runs on port 8000 (specified in config.json). We recommend running NGINX as a web proxy to forward http and websocket requests from port 80 to it. To install NGINX, run:

```
sudo apt update
sudo apt install nginx
```

You may need to adjust your firewall settings depending on the host, e.g.
* [Digital Ocean](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-18-04)
* [EC2](https://docs.nginx.com/nginx/deployment-guides/amazon-web-services/ec2-instances-for-nginx/)

### Configure NGINX

Create a new site config:
```
sudo nano /etc/nginx/sites-available/tasks
```

Copy and paste this configuration:
```
upstream tasks {
   server localhost:8000;
   keepalive 32;
}

server {
   listen 80 default_server;

   server_name tasks.example.com;

   location ~ /ws/* {
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       client_max_body_size 50M;
       proxy_set_header Host $http_host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header X-Frame-Options SAMEORIGIN;
       proxy_buffers 256 16k;
       proxy_buffer_size 16k;
       client_body_timeout 60;
       send_timeout 300;
       lingering_timeout 5;
       proxy_connect_timeout 1d;
       proxy_send_timeout 1d;
       proxy_read_timeout 1d;
       proxy_pass http://tasks;
   }

   location / {
       client_max_body_size 50M;
       proxy_set_header Connection "";
       proxy_set_header Host $http_host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header X-Frame-Options SAMEORIGIN;
       proxy_buffers 256 16k;
       proxy_buffer_size 16k;
       proxy_read_timeout 600s;
       proxy_cache_revalidate on;
       proxy_cache_min_uses 2;
       proxy_cache_use_stale timeout;
       proxy_cache_lock on;
       proxy_http_version 1.1;
       proxy_pass http://tasks;
   }
}
```

## Set up TLS on NGINX

For a production server, it's important to set up TLS to encrypt web traffic. Without this, your login passwords and data are unprotected. Refer to the [NGINX TLS guide](https://docs.nginx.com/nginx/admin-guide/security-controls/terminating-ssl-http/) and [Let's Encrypt guide](https://www.nginx.com/blog/using-free-ssltls-certificates-from-lets-encrypt-with-nginx/) on setting this up.

## Install Postgresql (Recommended)

Matterdeck stores data in a SQLite database by default, but we recommend running against Postgres in production (we've tested against Postgres 10.15). To install, run:

```
sudo apt install postgresql postgresql-contrib
```

Then run as the postgres user to create a new database:
```
sudo --login --user postgres
psql
```

On the psql prompt, run the following commands (**change the user/password** to your own values):
<pre>
CREATE DATABASE tasks;
CREATE USER <b>tasksuser</b> WITH PASSWORD '<b>tasksuser-password</b>';
\q
</pre>

Exit the postgres user session:
```
exit
```

Edit the Matterdeck config.json:

```
nano /opt/octo/config.json
```

Change the dbconfig setting to use the postgres database you created:
```
"dbconfig": "postgres://tasksuser:tasksuser-password@localhost/octo?sslmode=disable&connect_timeout=10",
```

## Configure Matterdeck to run as a service

This will keep the server running across reboots. First, create a new service config file:

```
sudo nano /lib/systemd/system/octo.service
```

Paste in the following:
```
[Unit]
Description=Matterdeck server

[Service]
Type=simple
Restart=always
RestartSec=5s
ExecStart=/opt/octo/bin/octoserver
WorkingDirectory=/opt/octo

[Install]
WantedBy=multi-user.target
```

Make systemd reload the new unit, and start it on machine reboot:
```
sudo systemctl daemon-reload
sudo systemctl start octo.service
sudo systemctl enable octo.service
```

## Test the server

At this point, the Matterdeck server should be running.

Test that it's running locally with:
```
curl localhost:8000
curl localhost
```

The first command checks that the server is running on port 8000 (default), and the second checks that NGINX is proxying requests successfully. Both commands should return the same snippet of html.

To access the server remotely, open a browser to its IP address or domain.

## Set up the server

Refer to the [server setup guide](/guide/server-setup/) to complete server setup.