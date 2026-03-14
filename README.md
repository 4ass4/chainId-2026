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

## Деплой токена CONS

```bash
npm install
export RPC_URL=http://localhost:8545
export DEPLOYER_PRIVATE_KEY=0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
npx hardhat run scripts/deploy-token.js --network demochain
```

(Ключ — pre-funded аккаунт из genesis, только для dev.)

## Blockscout

Клонировать [blockscout/blockscout](https://github.com/blockscout/blockscout), в `docker-compose` задать:

- `ETHEREUM_JSONRPC_VARIANT=besu`
- `ETHEREUM_JSONRPC_HTTP_URL=http://HOST:8545`
- `INDEXER_DISABLE_PENDING_TRANSACTIONS_FETCHER=true`

## Структура

- `qbftConfigFile.json` — конфиг genesis (chainId 2026)
- `scripts/setup-network.sh` — генерация genesis + ключей
- `contracts/ConsortiumToken.sol` — ERC20 CONS
- `scripts/deploy-token.js` — деплой и mint 1000 CONS
