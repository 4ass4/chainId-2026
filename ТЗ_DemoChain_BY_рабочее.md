# ТЗ: DemoChain BY (chainId: 2026) — РАБОЧАЯ ВЕРСИЯ

**Версия:** 2.0 (актуализировано март 2025)  
**Источник уточнений:** Hyperledger Besu 24.8, Blockscout 10.x, официальная документация

---

## 1. ОБЩИЕ СВЕДЕНИЯ

| Параметр | Значение |
|----------|----------|
| Название | DemoChain BY |
| chainId | 2026 |
| Цель | Живой демо-блокчейн для презентации Набсовету ПВТ |
| Срок | 5 рабочих дней |
| Бюджет | €100 (1 сервер Hetzner CPX21) + 40 ч dev |
| Консенсус | QBFT (рекомендованный enterprise-grade) |
| Валидаторы | **4 ноды** (QBFT требует min 4 для Byzantine fault tolerance) |

---

## 2. РЕЗУЛЬТАТ (что покажем ПВТ)

🌐 **http://demo.neotek.by:4000** — блокчейн онлайн

- [x] Explorer: блоки каждые 2 сек
- [x] MetaMask: баланс 1000 CONS
- [x] TON Bridge: mock «TON → CONS»
- [x] BYNEX vs Currency: симуляция ордеров
- [x] Kill 1 нода → сеть продолжает работать (tolerance = 1 при 4 нодах)

---

## 3. ТРЕБОВАНИЯ (уточнённые критерии)

| Функция | Критерий приемки | Примечание |
|---------|------------------|------------|
| Запуск | `docker compose up` = работающий стек за ≤5 мин | Blockscout: 9 контейнеров + Besu |
| Скорость | Блоки каждые 2 сек, целевой TPS до 500 | 500 TPS — ориентир для демо, не гарантия |
| Интерфейс | Blockscout explorer + простой demo-landing | |
| Биржи | Симуляция BYNEX/Currency ордеров | |
| Bridge | Mock TON → CONS токен | «Симуляция моста», не реальный cross-chain |
| Надежность | **4 ноды**, kill 1 = продолжает | 2/3 валидаторов должны работать |

---

## 4. ТЕХНИЧЕСКИЙ СТЕК (с конкретными версиями)

| Компонент | Спецификация | Docker image |
|-----------|--------------|--------------|
| Блокчейн | Hyperledger Besu 24.8+ | `hyperledger/besu:24.8.0` |
| Explorer | Blockscout 10.x | Репозиторий blockscout/blockscout, docker-compose |
| Токены | ERC20 (Solidity) | 1 контракт ConsortiumToken.sol |
| API | Node.js + Express | REST для демо |
| Инфра | Hetzner CPX21 | 8 vCPU, 16 GB RAM, 160 GB SSD, €30/мес |

---

## 5. ПОШАГОВЫЙ ПЛАН (5 дней)

### День 1: Инфраструктура

- [ ] 1. Заказать Hetzner CPX21, открыть порты 8545, 30303, 4000 (firewall)
- [ ] 2. Установить Docker 20.10+ и Docker Compose 2.x
- [ ] 3. Создать `qbftConfigFile.json` (chainId=2026, blockperiodseconds=2)
- [ ] 4. Выполнить: `besu operator generate-blockchain-config --config-file=qbftConfigFile.json --to=networkFiles --private-key-file-name=key`
- [ ] 5. Скопировать `genesis.json` и ключи валидаторов
- [ ] 6. Запустить 4 ноды Besu (bootnode + 3 peers), RPC на `0.0.0.0:8545` (для Docker)
- [ ] 7. Проверить: `curl -X POST -d '{"jsonrpc":"2.0","method":"qbft_getValidatorsByBlockNumber","params":["latest"],"id":1}' http://localhost:8545 -H "Content-Type: application/json"`

**Важно:** genesis генерируется через `besu operator generate-blockchain-config`, вручную extraData не создавать.

**Результат:** Блоки создаются каждые ~2 сек.

---

### День 2: Токены + Explorer

- [ ] 1. Deploy ERC20 ConsortiumToken (mint 1000 CONS на тестовый адрес)
- [ ] 2. Клонировать `github.com/blockscout/blockscout`, перейти в `docker-compose`
- [ ] 3. Настроить переменные:
  - `ETHEREUM_JSONRPC_VARIANT=besu`
  - `ETHEREUM_JSONRPC_HTTP_URL=http://<besu-host>:8545` (или service name)
  - `INDEXER_DISABLE_PENDING_TRANSACTIONS_FETCHER=true` (избежать ошибок с Besu)
- [ ] 4. Запуск: `docker compose up -d` (запускает 9 контейнеров)
- [ ] 5. Подключить MetaMask: RPC `http://IP:8545`, chainId 2026
- [ ] 6. Создать `META_MASK_SETUP.md` с инструкцией и RPC URL

**Особенности Blockscout:** требуется PostgreSQL 17, Redis, 4 Rust-микросервиса. Первая индексация может занять 5–10 мин.

**Результат:** Blockscout на :4000, MetaMask показывает CONS.

---

### День 3: TON Bridge Mock

- [ ] 1. BridgeMock.sol: lock/mint логика (или простой mint по событию)
- [ ] 2. Mock TON API (Node.js): fake TON tx, возвращает «успех»
- [ ] 3. Frontend: кнопка «Bridge TON → CONS»
- [ ] 4. Демо: «TON» → mint CONS в блокчейне за ~2 сек

**Важно:** Озвучивать как «симуляция моста TON → CONS», не как реальный cross-chain bridge.

**Результат:** Клик → tx в explorer.

---

### День 4: Биржи — симуляция

- [ ] 1. React/Vue страница:
  - Левый блок: «BYNEX продает 1000 TON»
  - Правый блок: «Currency покупает 1000 TON»
  - Кнопка «Исполнить» → транзакция в блокчейне
- [ ] 2. REST API: `POST /orders`, `POST /execute`

**Результат:** Симуляция ордеров → исполнение в блокчейне.

---

### День 5: Надёжность + презентация

- [ ] 1. Убедиться, что работают **4 ноды** Besu (не 3)
- [ ] 2. Kill-тест: `docker stop besu-node-1` → блоки продолжают идти
- [ ] 3. Дашборд: TPS, active nodes, volume
- [ ] 4. Видео: 2 мин screencast
- [ ] 5. Документация: README + META_MASK_SETUP.md + pitch для ПВТ

---

## 6. DOCKER-КОНФИГУРАЦИЯ

### 6.1 Besu (упрощённый пример для 1 ноды + 3 в отдельном compose)

```yaml
version: '3.8'
services:
  besu-bootnode:
    image: hyperledger/besu:24.8.0
    container_name: besu-1
    ports:
      - "8545:8545"
      - "30303:30303"
    volumes:
      - ./genesis.json:/config/genesis.json
      - besu-data-1:/data
    command: >
      --data-path=/data
      --genesis-file=/config/genesis.json
      --rpc-http-enabled
      --rpc-http-api=ETH,NET,WEB3,QBFT
      --rpc-http-host=0.0.0.0
      --host-allowlist=*
      --rpc-http-cors-origins=*
      --p2p-port=30303
      --nat-method=DOCKER
      --profile=ENTERPRISE
    restart: unless-stopped
volumes:
  besu-data-1:
```

**Для 4 нод:** использовать `besu operator generate-blockchain-config` и отдельные сервисы с bootnodes, разными `--p2p-port` и `--rpc-http-port` (см. [Besu QBFT Tutorial](https://besu.hyperledger.org/24.8.0/private-networks/tutorials/qbft)).

### 6.2 Blockscout

- Использовать официальный `blockscout/blockscout` репозиторий → `docker-compose/`
- Нет готового `besu.yml`; использовать общий compose, RPC на `http://besu-bootnode:8545` (или host IP)
- Обязательно: `ETHEREUM_JSONRPC_VARIANT=besu`, `INDEXER_DISABLE_PENDING_TRANSACTIONS_FETCHER=true`
- Linux/Docker: Besu должен слушать `0.0.0.0`, не `127.0.0.1`

### 6.3 Besu + Bonsai (24.6+)

В Besu 24.6+ по умолчанию `bonsai-limit-trie-logs-enabled=true` (512 слоёв). При 404 от Blockscout можно попробовать:

```
--Xbonsai-limit-trie-logs-enabled=false
```

или

```
--sync-mode=FULL
```

---

## 7. GENESIS — конфиг для генерации

Файл `qbftConfigFile.json` (chainId 2026, блоки каждые 2 сек):

```json
{
  "genesis": {
    "config": {
      "chainId": 2026,
      "berlinBlock": 0,
      "qbft": {
        "blockperiodseconds": 2,
        "epochlength": 30000,
        "requesttimeoutseconds": 4
      }
    },
    "nonce": "0x0",
    "timestamp": "0x58ee40ba",
    "gasLimit": "0x47b760",
    "difficulty": "0x1",
    "mixHash": "0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365",
    "coinbase": "0x0000000000000000000000000000000000000000",
    "alloc": {
      "627306090abaB3A6e1400e9345bC60c78a8BEf57": {
        "balance": "0xde0b6b3a7640000"
      }
    }
  },
  "blockchain": {
    "nodes": {
      "generate": true,
      "count": 4
    }
  }
}
```

Генерация:

```bash
besu operator generate-blockchain-config --config-file=qbftConfigFile.json --to=networkFiles --private-key-file-name=key
```

`networkFiles/genesis.json` содержит корректный `extraData` с 4 валидаторами.

---

## 8. DEMO-СЦЕНАРИЙ (7 минут)

| Минута | Действие |
|--------|----------|
| 1 | «Вот наш блокчейн онлайн!» — explorer, блоки каждые 2 сек |
| 2 | «Вот токен CONSORTIUM» — MetaMask, баланс 1000 CONS |
| 3 | «Симуляция TON → CONS за 2 секунды» — кнопка bridge → tx в explorer |
| 4 | «BYNEX и Currency» — симуляция ордеров → исполнение |
| 5 | «Надёжность» — stop одной ноды → «сеть продолжает работать» |
| 6 | «Масштаб» — график TPS, 4 active nodes |
| 7 | «Готово к production» — «5 серверов = все резиденты ПВТ» |

---

## 9. DELIVERABLES

```
📁 GitHub repo:
├── docker-compose.yml          # Besu (1 или 4 ноды)
├── genesis.json                # chainId 2026 (сгенерированный)
├── qbftConfigFile.json         # конфиг для генерации genesis
├── contracts/
│   ├── ConsortiumToken.sol
│   └── BridgeMock.sol
├── api-demo/                   # Node.js + симуляция бирж
├── frontend/                   # Bridge + ордера (React/Vue)
├── META_MASK_SETUP.md          # Инструкция MetaMask
├── demo.mp4                    # 2 мин screencast
└── README.md                   # Инструкция + pitch для ПВТ
```

---

## 10. ИНФРАСТРУКТУРА (Hetzner)

- **Сервер:** CPX21 (8 vCPU, 16 GB, 160 GB SSD)
- **Firewall:** открыть 80, 443, 4000 (Blockscout), 8545 (RPC), 30303 (P2P)
- **RPC:** `--host-allowlist=*` только для демо; в production — whitelist
- **Домен:** `demo.neotek.by` → A-запись на IP сервера

---

## 11. БЫСТРЫЕ ССЫЛКИ

| Ресурс | URL |
|--------|-----|
| Demo | http://demo.neotek.by:4000 |
| MetaMask RPC | http://IP:8545 |
| Besu QBFT Tutorial | https://besu.hyperledger.org/24.8.0/private-networks/tutorials/qbft |
| Blockscout Docker | https://github.com/blockscout/blockscout/tree/master/docker-compose |
| Blockscout Besu | `ETHEREUM_JSONRPC_VARIANT=besu` |

---

*Документ актуализирован по состоянию на март 2025. Версии: Besu 24.8, Blockscout 10.x.*
