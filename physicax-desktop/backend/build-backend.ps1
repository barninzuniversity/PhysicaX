$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\.."
$webRoot = Join-Path $root "web"
if (!(Test-Path $webRoot)) {
  $webRoot = Join-Path (Resolve-Path "$PSScriptRoot\..\..") "physicax-web"
}
$backendRoot = Join-Path $webRoot "cfd\\backend"
$python = Join-Path $backendRoot ".venv\\Scripts\\python.exe"
$outDir = Join-Path $PSScriptRoot "dist"
$workDir = Join-Path $PSScriptRoot "build"
$specDir = Join-Path $PSScriptRoot "spec"

if (!(Test-Path $python)) {
  Write-Error "Python virtualenv not found at $python. Create it and install requirements first."
}

& $python -m pip install --upgrade pyinstaller

if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
if (!(Test-Path $workDir)) { New-Item -ItemType Directory -Path $workDir | Out-Null }
if (!(Test-Path $specDir)) { New-Item -ItemType Directory -Path $specDir | Out-Null }

& $python -m PyInstaller `
  --onefile `
  --name physicax-cfd-backend `
  --distpath $outDir `
  --workpath $workDir `
  --specpath $specDir `
  (Join-Path $backendRoot "serve.py")
