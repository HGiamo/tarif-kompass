@echo off
rem Startet den M+E Tarif-Kompass als Server auf diesem PC
rem und gibt ihn verschluesselt im eigenen Tailnet frei.
title M+E Tarif-Kompass - Server
cd /d "%~dp0"

echo.
echo   Tarif-Kompass wird gestartet ...
echo.

rem Freigabe im Tailnet (nur wenn Tailscale vorhanden ist)
where tailscale >nul 2>&1
if %errorlevel%==0 (
  tailscale serve --bg 8765 >nul 2>&1
  if errorlevel 1 (
    echo   Hinweis: Die Tailnet-Freigabe hat nicht geklappt.
    echo   Pruefe im Tailscale-Admin, ob HTTPS-Zertifikate aktiviert sind:
    echo   https://login.tailscale.com/admin/dns
    echo.
  )
)

python "tools\serve.py" 8765

rem Freigabe nach dem Beenden wieder zuruecknehmen
where tailscale >nul 2>&1
if %errorlevel%==0 tailscale serve --bg off >nul 2>&1

echo.
echo   Server beendet. Fenster kann geschlossen werden.
pause >nul
