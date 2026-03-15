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

### 2. Настроить env: подставить полный файл

В репозитории DemoChain BY лежит готовый env для DemoChain BY:

**Файл в репо:** `docs/blockscout-demochain.env`

**На сервере:** скопировать его вместо стандартного env Blockscout:

```bash
# С хоста, где есть репо (или scp с локальной машины)
cp /root/demochain/docs/blockscout-demochain.env /root/blockscout/docker-compose/envs/common-blockscout.env
```

Или с локального ПК (из каталога репо):

```bash
scp docs/blockscout-demochain.env root@82.26.171.108:/root/blockscout/docker-compose/envs/common-blockscout.env
```

В файле уже подставлено:
- RPC: `http://172.17.0.1:8545/` (доступ с контейнера к RPC на хосте)
- `CHAIN_ID=2026`, `ETHEREUM_JSONRPC_VARIANT=openethereum`
- `API_V2_ENABLED=true`, порт 4000, отключены лишние индексеры

Если контейнер не достучится до RPC по `172.17.0.1`, узнать IP шлюза: `ip route | grep default | awk '{print $3}'` и в `common-blockscout.env` заменить `172.17.0.1` на этот IP в `ETHEREUM_JSONRPC_HTTP_URL` и `ETHEREUM_JSONRPC_TRACE_URL`.

### 3. Запуск

В каталоге `blockscout/docker-compose`:

```bash
docker compose up -d
```

Первый запуск может занять несколько минут (индексация).

### 4. Порт и URL

По умолчанию веб-интерфейс Blockscout слушает порт **80**. Чтобы открыть эксплорер на порту **4000**, в файле:

**Полный путь:** `/root/blockscout/docker-compose/docker-compose.yml`

Найти сервис **proxy** (nginx) и в нём секцию `ports` задать:

```yaml
ports:
  - "4000:80"
```

Сохранить файл. После `docker compose up -d` эксплорер будет доступен по адресу: **http://82.26.171.108:4000** (или ваш домен).

### 5. Ссылки на транзакции и контракты

- Транзакция: `http://82.26.171.108:4000/tx/0x833d1ef...`
- Контракт/токен: `http://82.26.171.108:4000/address/0xdDA6327139485221633A1FcD65f4aC932E60A2e1`

После индексации по адресу контракта можно смотреть балансы, транзакции, читать методы (name, symbol, decimals, balanceOf).

### 6. Переменная для API (опционально)

Чтобы в ответах API (мост, админка) подставлялась ссылка на эксплорер, в окружении процесса **demochain-api** задать:

- **Где:** в PM2 (например `pm2 set demochain-api EXPLORER_URL "http://82.26.171.108:4000"`) или в env-файле/скрипте запуска.
- **Что задать:** `EXPLORER_URL=http://82.26.171.108:4000` (или ваш домен).

Тогда в ответе будет `explorerUrl: "http://82.26.171.108:4000/tx/..."`.

## Итог

| Что            | Где смотреть |
|----------------|--------------|
| Блоки          | http://IP:4000/blocks |
| Транзакция     | http://IP:4000/tx/0x... |
| Контракт/токен | http://IP:4000/address/0x... |

Официальная документация: https://docs.blockscout.com/setup/deployment/docker-compose-deployment
