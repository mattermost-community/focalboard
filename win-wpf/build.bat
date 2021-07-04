@echo off

WHERE msbuild.exe > nul 2>&1
IF %ERRORLEVEL% NEQ 0 set PATH=%PATH%;C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin

WHERE msbuild.exe > nul 2>&1
IF %ERRORLEVEL% NEQ 0 set PATH=%PATH%;C:\Program Files (x86)\Microsoft Visual Studio\2019\Enterprise\MSBuild\Current\Bin

WHERE msbuild.exe > nul
IF %ERRORLEVEL% NEQ 0 echo msbuild.exe not found; exit /b 1

echo Building...

msbuild.exe Focalboard.sln /t:Rebuild /p:Configuration=Release  /p:Platform="x64" /p:DebugSymbols=false /p:DebugType=None
