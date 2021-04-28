---
title: "Personal Server (Docker)"
date: "2020-12-15T12:02:23-04:00"
subsection: Personal Edition
weight: 4
---

You can download and run the latest version of Focalboard Personal Server with a single-line <a href="https://www.docker.com/">Docker</a> command:

```
docker run -it -p 80:8000 mattermost/focalboard
```

Then open a browser to <a href="http://localhost">http://localhost</a>.

or, to specify a port number:

```
docker run -it -p <port>:8000 mattermost/focalboard
```

## To set up manually

Follow the steps in the [setup guide](../ubuntu) to configure Focalboard manually.
