# Plugin data being collected

Boards metadata is collected and sent to Mattermost every 24 hours. Visit the [Focalboard telemetry file](https://github.com/mattermost/focalboard/blob/main/webapp/src/telemetry/telemetryClient.ts) for information about the action and event data collected.

Other telemetry information that Mattermost collects includes:

## Server telemetry

### Boards Plugin Information

- Boards Version and Build Number
- Boards Edition
- Operating System for Boards server
- The server diagnostic ID

### Configuration Information

- ServerRoot is default server root (``true``/``false``)
- Port is default port (``true``/``false``)
- UseSSL (``true``/``false``)
- Database Type
- Single User (``true``/``false``)

### User Count Information

- Registered User Count
- Daily Active User Count
- Weekly Active User Count
- Monthly Active User Count

### Block Count Information

- Block Counts By Type

### Workspace Information

- Workspace Count

## Web app event activity

### Load Board View

- ``UserID``: Unique identifier of the server.
- ``UserActualID``: Unique identifier of the user who initiated the action.
- ``Event``: Type of the event. Only the ``view`` event is currently monitored.
- ``View Type`` (``board``, ``table``, ``gallery``).
