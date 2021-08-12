---
title: "Mattermost"
date: "2020-12-15T12:01:23-04:00"
section: "download"
weight: 2
---

Focalboard is now integrated with Mattermost v5.36 and later.

## Enable Focalboard plugin

To enable Focalboard, open your Mattermost instance, then:

1. Go to **Main Menu > Marketplace**.
2. Search for "Focalboard".
3. Install the Focalboard plugin.
4. Select **Configure** and enable the plugin.
5. Select **Save**.

The Focalboard plugin requires websocket traffic to be passed by the proxy. Update your NGINX or Apache web proxy config following the steps below.

### With NGINX

After following the standard [Mattermost install steps](https://docs.mattermost.com/install/install-ubuntu-1804.html#configuring-nginx-as-a-proxy-for-mattermost-server), edit `/etc/nginx/sites-available/mattermost` and add this section to it:

```
   location ~ /plugins/focalboard/ws/* {
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
       proxy_connect_timeout 90;
       proxy_send_timeout 300;
       proxy_read_timeout 90s;
       proxy_pass http://backend;
   }
```

Restart NGINX with `sudo systemctl restart nginx`.

### With Apache (unofficial)

After following the [install guide for Apache and Mattermost](https://docs.mattermost.com/install/config-apache2.html#configuring-apache2-as-a-proxy-for-mattermost-server-unofficial), modify the web sockets section in `/etc/apache2/sites-available` as follows:

```
 # Set web sockets
  RewriteEngine On
  RewriteCond %{REQUEST_URI} /api/v[0-9]+/(users/)?websocket|/plugins/focalboard/ws/* [NC,OR]
  RewriteCond %{HTTP:UPGRADE} ^WebSocket$ [NC,OR]
  RewriteCond %{HTTP:CONNECTION} ^Upgrade$ [NC]
  RewriteRule .* ws://127.0.0.1:8065%{REQUEST_URI} [P,QSA,L]
  ```

Restart Apache with `sudo systemctl restart apache2`

## Accessing Focalboard from Mattermost

<img src='https://user-images.githubusercontent.com/46905241/121930013-bbd12880-ccf6-11eb-9647-c9e367690111.png' style='max-height: 50px' />

In Mattermost, select the Focalboard icon in the channel header to access boards for that channel.

### Focalboard Permissions

Focalboard currently uses channel-based permissions, meaning that only members of the associated channel can access (read / write) the boards for that channel.

You can use this to create private boards:
1. Create or join a private channel (or group channel or direct-message)
2. Click on the Focalboard icon in the channel header
3. Create a board

Only members of that private channel can access the board.

You can use the [share board](/guide/user/#sharing-boards) feature to share a read-only board with anyone (incuding unauthenticated users) who has the generated link.