# Focalboard Windows Personal Desktop

This folder contains the code for the Windows Personal Desktop. It packages a lightweight C# Windows App with the Windows build of the server, and the webapp. The server is run in a single-user mode.

## Debugging in Visual Studio

Open `Focalboard.sln` in Visual Studio to debug it.

### Testing the single-user server

You can also run the server in single-user mode and connect to it via a browser:

1. Run `FOCALBOARD_SINGLE_USER_TOKEN=testtest make watch-single-user`
  * This runs the server with the `-single-user` flag
  * Alternatively, select `Go: Launch Single-user Server` from VSCode's run and debug options
2. Open a browser to `http://localhost:8000`
3. Open the browser developer tools to Application \ Local Storage \ localhost:8000
4. Set `focalboardSessionId` to `testtest`
5. Navigate to `http://localhost:8000`
