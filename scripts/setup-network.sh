#!/bin/bash
set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

rm -rf networkFiles
mkdir -p networkFiles
chmod 777 networkFiles

echo "Generating genesis and validator keys..."
GEN_CONTAINER="besu-genesis-$$"
docker run --name "$GEN_CONTAINER" --user root \
  -v "$(pwd)/qbftConfigFile.json:/config/config.json:ro" \
  hyperledger/besu:24.8.0 \
  besu operator generate-blockchain-config \
  --config-file=/config/config.json \
  --to=/tmp/networkFiles \
  --private-key-file-name=key

docker cp "$GEN_CONTAINER:/tmp/networkFiles/." ./networkFiles/
docker rm "$GEN_CONTAINER" 2>/dev/null || true

if [ ! -f networkFiles/genesis.json ]; then
  echo "Genesis generation failed"
  exit 1
fi

cp networkFiles/genesis.json genesis.json

mkdir -p node-1/data node-2/data node-3/data node-4/data
KEYS_DIR="networkFiles/keys"
idx=1
for addr_dir in "$KEYS_DIR"/0x*; do
  if [ -d "$addr_dir" ] && [ -f "$addr_dir/key" ]; then
    cp "$addr_dir/key" "node-$idx/data/"
    cp "$addr_dir/key.pub" "node-$idx/data/"
    echo "Node $idx: key copied from $(basename "$addr_dir")"
    idx=$((idx + 1))
  fi
  if [ $idx -gt 4 ]; then
    break
  fi
done

if [ $idx -ne 5 ]; then
  echo "Expected 4 validator keys, found $((idx - 1))"
  exit 1
fi

NODE1_PUBKEY=$(xxd -p -c 256 node-1/data/key.pub | tr -d '\n')
echo "NODE1_ENODE=enode://${NODE1_PUBKEY}@besu-1:30303" > .env.besu
echo "Setup complete. Run: docker compose up -d"
