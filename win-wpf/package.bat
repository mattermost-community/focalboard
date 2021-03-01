@echo off

WHERE makeappx.exe > nul 2>&1
IF %ERRORLEVEL% NEQ 0 set PATH=%PATH%;C:\Program Files (x86)\Windows Kits\10\App Certification Kit

WHERE makeappx.exe > nul
IF %ERRORLEVEL% NEQ 0 echo makeappx.exe not found; exit /b 1

echo Packaging...

rd /s /q msix
mkdir msix
xcopy /e /i /y Focalboard\bin\x64\Release msix
mkdir msix\Assets
copy art\StoreLogo.png msix\Assets
copy art\icon150.png msix\Assets
copy art\icon44.png msix\Assets
copy AppxManifest.xml msix
makeappx.exe pack /o /v /d msix /p Focalboard.msix
