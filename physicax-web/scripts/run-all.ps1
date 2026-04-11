$root = "C:\Users\ibzao\Downloads\Project\physicax-web"
$backendScript = Join-Path $root "scripts\run-backend.ps1"
$frontendScript = Join-Path $root "scripts\run-frontend.ps1"

Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $backendScript -WorkingDirectory $root
Start-Sleep -Seconds 2
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $frontendScript -WorkingDirectory $root

Write-Host "Started backend and frontend in separate windows."
