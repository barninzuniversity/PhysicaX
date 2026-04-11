$root = "C:\Users\ibzao\Downloads\Project\physicax-web"
$export = Join-Path $root "cfd\openfoam\output\sample.csv"
$env:OPENFOAM_EXPORT_PATH = $export
Set-Location (Join-Path $root "cfd\backend")
$venv = Join-Path $root "cfd\backend\.venv"
$python = Join-Path $venv "Scripts\python.exe"
if (-not (Test-Path $python)) {
  $systemPython = Get-Command python -ErrorAction SilentlyContinue
  if (-not $systemPython) {
    Write-Host "Python not found. Install Python 3.10+ and re-run."
    exit 1
  }
  python -m venv $venv
}
& $python -m pip install -r requirements.txt
& $python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
