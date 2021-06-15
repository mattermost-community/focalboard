---
title: "User's Guide"
date: "2020-12-15T12:01:23-04:00"
section: "guide"
weight: 2
---

This guide is an overview of the basic features to get you started. Focalboard is an open source project that is being updated continuously.

[Let us know](/feedback/) if there's a feature you are looking for, or [connect with our vibrant community](/contribute/getting-started/) to help bring it to life.

## Enabling Focalboard

1. Go to **Main Menu > Marketplace**.
2. Search for "Focalboard".
3. Install the Focalboard plugin.
4. Select **Configure** and enable the plugin.
5. Select **Save**.

The Focalboard plugin requires websocket traffic to be passed by the proxy. Update your NGINX or Apache web proxy config following these steps.

## With NGINX

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

In Mattermost, select the Focalboard icon in the channel header to access boards for that channel.

## Adding new Boards

1. Select **+ Add Board** in the bottom left of the sidebar to add a new board to Focalboard.
2. Pick a template, such as **Project Tasks**, from the list.
3. This shows the first view of the new board, which is a table of all tasks.

![image](./all%20tasks.png)

4. Click on "By Status" in the sidebar to see a board view.

![image](./by%20status.png)

5. Click on the properties menu, and turn on "Priority" and "Date created". This will add those properties to the card display.

![image](./by%20status%20properties.png)

6. You can likewise change the **Group By**, **Filter**, and **Sort** settings of the view.
7. In general, all changes you make are saved immediately and are visible to all other users.

## Renaming Boards

Click on the board title to edit it. You can also set an icon on boards and cards.

## Adding new Views

Click on the dropdown next to the view name, and click **Add view** to add a new view.

![image](./add%20view.png)

### Dragging cards

Drag cards from one column to another to change their group-by property. For example, drag a card to the **Completed** column to mark it as completed.

When a board is unsorted, you can drag a card to a specific row in a column. For sorted boards, dragging a card to a column with auto-sort it using the specified sort settings.

### Editing cards

Select a card to edit it. A card consists of:

1. **A set of properties:** Properties are common to all cards in a board. Board views can group cards by "Select" type properties into different columns.
2. **A list of comments:** Comments are useful for noting important changes or milestones.
3. **A set of content:** The content of a card can consist of markdown text and images. Use this to record detailed specs or design decisions for an item for example.

Press ESC or click outside the card editor dialog to close the card editor.

### Table Views

Each column corresponds to a card property. Cells can be edited directly, or you can open the card editor for a row by hovering over the title and clicking "open".

Click on headers to sort them, or insert new properties.

![image](./table%20header%20menu.png)

### Card templates

Each board can have a set of card templates. To create a new card template, click on the dropdown by the "New" button and select "+ New template".

A card editor opens with a banner indicating this is a template.

You can new create new cards using this new template.

Alternatively, you can turn any card into a template:

1. Open the card editor.
2. Select the options menu (**...** at the top right), then select **New template from card**.

### Board templates

Similarly, you can create board templates from the "+ Add board" menu. To turn an existing board into a template:

1. Hover over the board title in the sidebar.
2. Select the options menu (**...**), then select **New template from board**.

![image](./board%20sidebar%20menu.png)

### Sharing boards

1. Hover over the right-hand side of the board menu.
2. Click on the options menu (**...**) and select **Share board**.
![image](./share%20board.png)

3. Turn the switch on which says **Publish to web and share this board with anyone**.
![image](./share%20board%20menu.png)

4. Copy the given link.
5. You can now share the copied link with others. Anyone with the link will be able to view the board)
6. Select **Regenerate Token** if you want to invalidate all the previously shared links.
7. A message asking **This will invalidate previously shared links. Continue?** will pop up. Select **OK** and the token will be regenerated.

### Archives

You can export an archive of all your boards from the settings menu.

![image](./settings%20menu.png)

This is handy to quickly back-up snapshots, or to transfer them to different installations, for example from a Personal Desktop to a server install. Note that the archive does not (currently) include image and file attachments, such as images included in a card.

Also note that importing an archive will overwrite changes to items, but will not affect additional items (e.g. boards and cards) that are not part of the archive.
