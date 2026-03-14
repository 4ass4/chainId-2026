$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

Write-Host "Generating genesis and validator keys..."
docker compose -f docker-compose.genesis.yml --profile gen run --rm genesis-generator

if (-not (Test-Path "networkFiles/genesis.json")) {
    Write-Error "Genesis generation failed"
    exit 1
}

Copy-Item "networkFiles/genesis.json" "genesis.json"

@("node-1", "node-2", "node-3", "node-4") | ForEach-Object {
    New-Item -ItemType Directory -Force -Path "$_/data" | Out-Null
}

$keyDirs = Get-ChildItem -Path "networkFiles/keys" -Directory -Filter "0x*" | Sort-Object Name
$idx = 1
foreach ($dir in $keyDirs) {
    if ($idx -gt 4) { break }
    $keyPath = Join-Path $dir.FullName "key"
    if (Test-Path $keyPath) {
        Copy-Item $keyPath "node-$idx/data/key"
        Copy-Item (Join-Path $dir.FullName "key.pub") "node-$idx/data/key.pub"
        Write-Host "Node $idx : key from $($dir.Name)"
        $idx++
    }
}

if ($idx -ne 5) {
    Write-Error "Expected 4 validator keys, found $($idx - 1)"
    exit 1
}

$bytes = [System.IO.File]::ReadAllBytes((Join-Path $projectRoot "node-1\data\key.pub"))
$pubKey = ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
"NODE1_ENODE=enode://$pubKey@besu-1:30303" | Out-File -FilePath ".env.besu" -Encoding ascii
Write-Host "Setup complete. Run: docker compose up -d"
