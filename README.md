# DemoChain BY (chainId: 2026)

Демо-блокчейн для презентации ПВТ. Hyperledger Besu QBFT, 4 ноды, блоки каждые 2 сек.

## Быстрый старт (на сервере с Docker)

```bash
git clone https://github.com/4ass4/chainId-2026.git
cd chainId-2026
chmod +x scripts/setup-network.sh
./scripts/setup-network.sh
docker compose up -d
```

RPC: http://localhost:8545 (или IP сервера)

## Проверка

Блоки:
```bash
curl -X POST -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  -H "Content-Type: application/json" http://localhost:8545
```

4 валидатора:
```bash
curl -X POST -d '{"jsonrpc":"2.0","method":"qbft_getValidatorsByBlockNumber","params":["latest"],"id":1}' \
  -H "Content-Type: application/json" http://localhost:8545
```

## Структура

- `qbftConfigFile.json` — конфиг для genesis (chainId 2026)
- `scripts/setup-network.sh` — генерация genesis + ключей + подготовка нод
- `docker-compose.yml` — 4 ноды Besu QBFT
