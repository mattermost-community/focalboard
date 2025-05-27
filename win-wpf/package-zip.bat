@echo off

if exist dist\karmaboard-win.zip del /q dist\karmaboard-win.zip
if not exist dist mkdir dist

if exist temp del /s /f /q temp
rmdir /s /q temp
if not exist temp mkdir temp
xcopy /e /i /y Karmaboard\bin\x64\Release temp
copy ..\build\MIT-COMPILED-LICENSE.md temp
copy ..\NOTICE.txt temp
copy ..\webapp\NOTICE.txt temp\webapp-NOTICE.txt

echo --- Contents of temp ---
dir /s /b temp
echo ---

powershell Compress-Archive -Path temp\* -DestinationPath dist\karmaboard-win.zip
