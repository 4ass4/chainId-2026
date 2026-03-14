$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

if (Test-Path "networkFiles") {
    Remove-Item -Recurse -Force networkFiles
}

docker run --rm -v "${projectRoot}:/workspace" hyperledger/besu:24.8.0 operator generate-blockchain-config --config-file=/workspace/qbftConfigFile.json --to=/workspace/networkFiles --private-key-file-name=key

if (-not (Test-Path "networkFiles/genesis.json")) {
    Write-Error "Genesis generation failed"
    exit 1
}

Copy-Item "networkFiles/genesis.json" "genesis.json"
Write-Host "genesis.json created successfully"
