# Свой эксплорер (Blockscout) для DemoChain BY

Blockscout — блок-эксплорер для EVM-сетей. Позволяет смотреть блоки, транзакции и контракты по адресу (в т.ч. токены) в браузере.

## Требования

- На сервере уже запущены Besu (RPC на порту 8545) и API.
- Docker и Docker Compose на том же сервере.

## Шаги на сервере

### 1. Клонировать Blockscout

```bash
cd /root
git clone --depth 1 https://github.com/blockscout/blockscout.git
cd blockscout/docker-compose
```

### 2. Настроить подключение к вашей ноде

RPC DemoChain BY на хосте: `http://82.26.171.108:8545` (или локально `http://127.0.0.1:8545`). Контейнеры Blockscout должны достучаться до этого порта.

**Вариант A — контейнеры на том же хосте:**  
Использовать доступ к хосту из Docker (Linux):

```bash
# Узнать IP шлюза хоста с точки зрения контейнера (часто 172.17.0.1)
ip route | grep default | awk '{print $3}'
```

Создать файл переопределения env (например `envs/demochain.env` или править `envs/common-blockscout.env`):

```env
ETHEREUM_JSONRPC_HTTP_URL=http://172.17.0.1:8545
ETHEREUM_JSONRPC_WS_URL=ws://172.17.0.1:8545
CHAIN_ID=2026
ETHEREUM_JSONRPC_VARIANT=openethereum
API_V2_ENABLED=true
INDEXER_DISABLE_INTERNAL_TRANSACTIONS_FETCHER=true
INDEXER_DISABLE_PENDING_TRANSACTIONS_FETCHER=true
```

Если в Docker настроен `host.docker.internal`:

```env
ETHEREUM_JSONRPC_HTTP_URL=http://host.docker.internal:8545
ETHEREUM_JSONRPC_WS_URL=ws://host.docker.internal:8545
CHAIN_ID=2026
```

**Вариант B — Besu и Blockscout в одной Docker-сети:**  
Если Blockscout будет в одном `docker-compose` с Besu (или в сети, где есть контейнер с RPC), укажите имя сервиса вместо IP, например:

```env
ETHEREUM_JSONRPC_HTTP_URL=http://besu-1:8545
ETHEREUM_JSONRPC_WS_URL=ws://besu-1:8545
CHAIN_ID=2026
```

### 3. Запуск

В каталоге `blockscout/docker-compose`:

```bash
docker compose up -d
```

Первый запуск может занять несколько минут (индексация).

### 4. Порт и URL

По умолчанию веб-интерфейс Blockscout слушает порт **80**. Чтобы отдать порт **4000** на хосте, в `docker-compose` у сервиса proxy (nginx) задайте:

```yaml
ports:
  - "4000:80"
```

Тогда эксплорер будет доступен по адресу: **http://82.26.171.108:4000** (или ваш домен).

### 5. Ссылки на транзакции и контракты

- Транзакция: `http://82.26.171.108:4000/tx/0x833d1ef...`
- Контракт/токен: `http://82.26.171.108:4000/address/0xdDA6327139485221633A1FcD65f4aC932E60A2e1`

После индексации по адресу контракта можно смотреть балансы, транзакции, читать методы (name, symbol, decimals, balanceOf).

### 6. Переменная для API (опционально)

Чтобы в ответах API (мост, админка) подставлялась ссылка на эксплорер, на сервере в окружении процесса API задайте:

```env
EXPLORER_URL=http://82.26.171.108:4000
```

(или ваш домен). Тогда в ответе будет `explorerUrl: "http://82.26.171.108:4000/tx/..."`.

## Итог

| Что            | Где смотреть |
|----------------|--------------|
| Блоки          | http://IP:4000/blocks |
| Транзакция     | http://IP:4000/tx/0x... |
| Контракт/токен | http://IP:4000/address/0x... |

Официальная документация: https://docs.blockscout.com/setup/deployment/docker-compose-deployment
