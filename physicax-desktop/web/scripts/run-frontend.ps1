$root = "C:\Users\ibzao\Downloads\Project\physicax-web"
$nodeDir = "C:\Users\ibzao\Downloads\Project\tools\node-v20.12.2-win-x64"
$env:Path = "$nodeDir;$env:Path"

function Test-PortFree {
  param([int]$Port)
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
    $listener.Start()
    $listener.Stop()
    return $true
  } catch {
    return $false
  }
}

$port = 3000
while (-not (Test-PortFree -Port $port) -and $port -lt 3010) {
  $port++
}

$env:PORT = "$port"
$env:NEXTAUTH_URL = "http://localhost:$port"

Set-Location $root
Write-Host "Starting Next.js on port $port (NEXTAUTH_URL=$env:NEXTAUTH_URL)"
npm run dev
