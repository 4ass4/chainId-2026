# План работ: DemoChain BY (chainId: 2026)

**Репозиторий:** https://github.com/4ass4/chainId-2026  
**Сервер:** root@215814 (Linux Debian 12, root)  
**Срок:** 5 рабочих дней

---

## РОЛЬ АГЕНТА

Агент **обязан** при каждом этапе:

1. **Писать код** — локально в проекте, без заглушек и TODO вместо логики.
2. **Чистый код** — без закомментированных строк, без мёртвого кода, без `console.log` в production.
3. **Проверять** — код должен работать; обрабатывать ошибки RPC/API.
4. **Git** — после каждой логической правки выполнять:
   - `git add .`
   - `git commit -m "краткое описание"`
   - `git push origin main`
5. **Деплой** — после пуша выдавать команды для деплоя на root@215814.

---

## ЭТАП 1: Инфраструктура (День 1)

### 1.1 Конфигурация genesis

- [ ] Создать `qbftConfigFile.json` (chainId=2026, blockperiodseconds=2, 4 валидатора)
- [ ] Добавить скрипт/инструкцию генерации genesis (Besu CLI или Docker)
- [ ] Сгенерировать `genesis.json` и `networkFiles/keys/*` (если Besu доступен локально)

**Git + деплой** после изменений.

### 1.2 Docker Compose — Besu (4 ноды)

- [ ] Создать `docker-compose.yml` с 4 нодами Besu (chainId 2026, QBFT)
- [ ] Bootnode + 3 peers, bootnodes, разные p2p/rpc-порты
- [ ] RPC на `0.0.0.0:8545` (первая нода), `--nat-method=DOCKER`
- [ ] Проверка: `qbft_getValidatorsByBlockNumber` → 4 валидатора

**Git + деплой.** Команды: `ssh root@215814`, `cd /root/demochain`, `git pull`, `docker compose up -d -f docker-compose.besu.yml`

### 1.3 Проверка работы сети

- [ ] Блоки каждые ~2 сек
- [ ] curl/JSON-RPC проверка

**Результат этапа:** Besu на 4 нодах пишет блоки.

---

## ЭТАП 2: Токены + Explorer (День 2)

### 2.1 ERC20 ConsortiumToken

- [ ] Создать `contracts/ConsortiumToken.sol` (Solidity 0.8.x)
- [ ] Функции: `mint`, `balanceOf`, стандарт ERC20
- [ ] Адрес minter в конструкторе (без хардкода)
- [ ] Скрипт деплоя (Node.js + ethers/web3) и mint 1000 CONS на тестовый адрес

**Git + деплой.**

### 2.2 Blockscout

- [ ] Добавить в проект Blockscout-конфиг или submodule/клонирование
- [ ] ENV: `ETHEREUM_JSONRPC_VARIANT=besu`, `INDEXER_DISABLE_PENDING_TRANSACTIONS_FETCHER=true`
- [ ] `ETHEREUM_JSONRPC_HTTP_URL` → Besu RPC (host:8545)
- [ ] docker-compose: Blockscout (или ссылка на официальный compose + overrides)
- [ ] Порты: 4000 (Blockscout)

**Git + деплой.**

### 2.3 MetaMask

- [ ] Создать `META_MASK_SETUP.md`: RPC URL, chainId 2026, символ CONS
- [ ] Указать http://IP:8545 и http://demo.neotek.by:8545 (когда домен готов)

**Результат этапа:** Blockscout доступен, MetaMask показывает CONS.

---

## ЭТАП 3: TON Bridge Mock (День 3)

### 3.1 BridgeMock.sol

- [ ] Контракт: функция `mintFromBridge(address to, uint256 amount)` — только minter
- [ ] Событие `Bridged(address indexed to, uint256 amount)` для логов

**Git + деплой.**

### 3.2 Mock TON API (Node.js)

- [ ] `api-demo/` или `bridge-mock/`: Express, endpoint `POST /bridge/ton-to-cons`
- [ ] Принимает адрес получателя, вызывает mint в BridgeMock
- [ ] Обработка ошибок, таймауты RPC

**Git + деплой.**

### 3.3 Frontend

- [ ] `frontend/` или страница в api-demo: кнопка «Bridge TON → CONS»
- [ ] Вызов API → отображение tx hash / ссылка на explorer

**Результат этапа:** Клик → mint CONS → tx в explorer.

---

## ЭТАП 4: Биржи — симуляция (День 4)

### 4.1 REST API

- [ ] `POST /orders` — принять ордер (BYNEX/Currency)
- [ ] `POST /execute` — симулировать исполнение (записать tx в блокчейн)
- [ ] Структуры данных: биржа, сторона, объём, цена (или упрощённо)

**Git + деплой.**

### 4.2 Frontend — ордера

- [ ] Левый блок: «BYNEX продает 1000 TON»
- [ ] Правый блок: «Currency покупает 1000 TON»
- [ ] Кнопка «Исполнить» → вызов `/execute` → показ tx в explorer

**Результат этапа:** Симуляция ордеров и исполнение в блокчейне.

---

## ЭТАП 5: Надёжность + презентация (День 5)

### 5.1 Kill-тест

- [ ] Убедиться: 4 ноды Besu запущены
- [ ] Документировать: `docker stop besu-node-1` → блоки продолжают
- [ ] Зафиксировать в README или отдельном скрипте

**Git + деплой.**

### 5.2 Дашборд

- [ ] TPS, active nodes, volume — простая страница или обновление frontend
- [ ] Данные с RPC (`eth_blockNumber`, `qbft_getValidatorsByBlockNumber`) или API

**Git + деплой.**

### 5.3 Документация

- [ ] `README.md`: запуск `docker compose up`, ссылки на explorer, MetaMask
- [ ] Pitch для ПВТ (краткий текст в README или отдельный файл)
- [ ] `demo.mp4` (2 мин) — инструкция по записи screencast

**Результат этапа:** Демо готово для презентации.

---

## КОМАНДЫ ДЕПЛОЯ (шаблон)

После каждого `git push` агент выдаёт:

```bash
ssh root@215814
cd /root/demochain   # уточнить путь на сервере
git pull origin main
docker compose pull
docker compose up -d
```

При изменении только frontend/API — указать, какие сервисы перезапускать.

---

## СТРУКТУРА РЕПОЗИТОРИЯ (целевая)

```
chainId-2026/
├── docker-compose.yml           # или docker-compose.besu.yml + overrides
├── docker-compose.blockscout.yml
├── genesis.json
├── qbftConfigFile.json
├── networkFiles/                # ключи (опционально в .gitignore)
├── contracts/
│   ├── ConsortiumToken.sol
│   └── BridgeMock.sol
├── api-demo/                    # Node.js REST + bridge mock + orders
├── frontend/                    # Bridge UI + ордера
├── scripts/                     # deploy, genesis generation
├── META_MASK_SETUP.md
├── README.md
├── PLAN_РАБОТ.md
└── .cursor/rules/code-quality-mandatory.mdc
```

---

## ПОРЯДОК ВЫПОЛНЕНИЯ

| # | Этап | Зависимости |
|---|------|-------------|
| 1 | Инфраструктура (genesis + 4 ноды Besu) | — |
| 2 | ConsortiumToken + Blockscout + MetaMask | Этап 1 |
| 3 | Bridge mock (контракт + API + frontend) | Этап 2 |
| 4 | Биржи (API + frontend ордера) | Этап 2 |
| 5 | Kill-тест, дашборд, документация | Этапы 1–4 |
