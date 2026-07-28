@echo off
cd /d "%~dp0"
echo [*] The Apostles Summit - Launching...
echo.

where python > NUL 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [*] Starting server with Python...
    start /B python -m http.server 8000 > NUL 2>&1
) else (
    where npx > NUL 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [*] Starting server with Node.js...
        start /B npx http-server -p 8000 --cors > NUL 2>&1
    ) else (
        echo [!] ERROR: Neither Python nor Node.js found.
        echo     Install Python (https://python.org) or Node.js (https://nodejs.org)
        echo.
        pause
        exit /b 1
    )
)

timeout /t 2 /nobreak > NUL
start "" "http://localhost:8000/index.html"
echo.
echo  Site running at: http://localhost:8000
echo  Close this window to stop the server.
echo.
pause > NUL
taskkill /F /IM python.exe > NUL 2>&1
taskkill /F /IM node.exe > NUL 2>&1
echo Server stopped.
