#!/bin/bash
set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

rm -rf networkFiles

docker run --rm -v "${PROJECT_ROOT}:/workspace" hyperledger/besu:24.8.0 operator generate-blockchain-config --config-file=/workspace/qbftConfigFile.json --to=/workspace/networkFiles --private-key-file-name=key

if [ ! -f networkFiles/genesis.json ]; then
  echo "Genesis generation failed"
  exit 1
fi

cp networkFiles/genesis.json genesis.json
echo "genesis.json created successfully"
