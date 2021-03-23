@echo off

if exist dist\focalboard-win.zip del /q dist\focalboard-win.zip
if not exist dist mkdir dist

powershell Compress-Archive -Path Focalboard\bin\x64\Release\* -DestinationPath dist\focalboard-win.zip
