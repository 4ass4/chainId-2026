#!/bin/bash
echo "Kill test: stopping besu-1..."
docker stop besu-1
echo "Wait 10 sec, check blocks..."
sleep 10
curl -s -X POST -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H "Content-Type: application/json" http://localhost:8546
echo ""
echo "Restart besu-1: docker start besu-1"
