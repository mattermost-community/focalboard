# Focalboard Mac Personal Desktop

This folder contains the code for the Mac Personal Desktop. It packages a lightweight Swift Mac App with the Mac build of the server, and the webapp. The server is run in a single-user mode.

## Debugging in Xcode

Open `Focalboard.xcworkspace` in Xcode to debug it.

To debug the client webapp:
1. Run the Focalboard desktop app from Xcode
2. Open Safari
3. Enable Safari's [developer tools]
4. Select the Focalboard app from the develop menu, under your computer's name

### Testing the single-user server

You can also run the server in single-user mode and connect to it via a browser:

1. Run `FOCALBOARD_SINGLE_USER_TOKEN=testtest make watch-single-user`
  * This runs the server with the `-single-user` flag
  * Alternatively, select `Go: Launch Single-user Server` from VSCode's run and debug options
2. Open a browser to `http://localhost:8000`
3. Open the browser developer tools to Application \ Local Storage \ localhost:8000
4. Set `focalboardSessionId` to `testtest`
5. Navigate to `http://localhost:8000`
