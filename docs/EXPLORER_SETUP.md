# Свой эксплорер (Blockscout) для DemoChain BY

Blockscout — блок-эксплорер для EVM-сетей. Позволяет смотреть блоки, транзакции и контракты по адресу (в т.ч. токены) в браузере.

> **Важно:** эксплорер открывайте **в браузере** по адресу **http://82.26.171.108:4000** (или ваш домен). Адрес **127.0.0.1** в документации используется только для команд, которые выполняются **на сервере** (по SSH); в браузере на вашем ПК 127.0.0.1 не откроется — там ничего не запущено.

**Порты на сервере:**
- **3013** — ваш API (demochain-api, PM2).
- **4000** — эксплорер Blockscout (доступ в браузере: http://IP:4000).
- **3000** — внутри контейнера frontend слушает только 3000; nginx обращается к нему по внутренней сети. Контейнер **не должен** публиковать порт 3000 на хост (иначе конфликт с другим приложением на 3000). См. ниже раздел «Не занимать порт 3000 на хосте».

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

### 2b. Env фронта (чтобы на главной были блоки и транзакции)

Если на главной странице эксплорера «No data», но по SSH на сервере команда `curl http://127.0.0.1:4000/api/v2/blocks?limit=3` возвращает данные, значит браузер обращается к API по неправильному хосту. Нужно задать для фронта тот же хост и порт, по которым открывают эксплорер:

**Файл в репо:** `docs/blockscout-frontend-demochain.env`

**На сервере:**

```bash
cp /root/demochain/docs/blockscout-frontend-demochain.env /root/blockscout/docker-compose/envs/common-frontend.env
```

Или с локального ПК:

```bash
scp docs/blockscout-frontend-demochain.env root@82.26.171.108:/root/blockscout/docker-compose/envs/common-frontend.env
```

В файле заданы `NEXT_PUBLIC_APP_HOST` и `NEXT_PUBLIC_API_HOST=82.26.171.108`, порт 4000, а также отключена реклама Blockscout (`NEXT_PUBLIC_AD_BANNER_PROVIDER=none`, `NEXT_PUBLIC_AD_TEXT_PROVIDER=none`) — в вашем эксплорере не будет сторонних баннеров и текстовых объявлений.

После копирования пересоздать контейнер фронта и перезапустить стек:

```bash
cd /root/blockscout/docker-compose
docker compose up -d --force-recreate frontend
# или полный перезапуск:
docker compose down && docker compose up -d
```

Если после этого блоки/транзакции по-прежнему не грузятся, фронт может быть собран с зашитым API host; тогда нужно пересобрать образ фронта с этим env (см. документацию Blockscout по сборке фронта).

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

### 4b. Не занимать порт 3000 на хосте

Контейнер frontend слушает порт 3000 **внутри** Docker; к нему обращается только nginx (proxy). На хосте порт 3000 не нужен и не должен использоваться Blockscout — иначе конфликт с другим приложением (у вас API на 3013, но 3000 может быть занят чем-то ещё).

Проверьте файл **`/root/blockscout/docker-compose/services/frontend.yml`**. Если в сервисе `frontend` есть секция `ports:` с маппингом на 3000 (например `- "3000:3000"` или `- "0.0.0.0:3000:3000"`), её нужно **удалить или закомментировать**. После правки:

```bash
cd /root/blockscout/docker-compose
docker compose up -d frontend
```

Снаружи эксплорер по-прежнему открывается только по **порту 4000** (через proxy).

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

---

## 502 Bad Gateway (nginx)

Ошибка значит: nginx работает, но не может достучаться до backend или frontend. Выполните **на сервере по SSH**:

```bash
cd /root/blockscout/docker-compose
docker compose ps
```

- Все сервисы должны быть в состоянии **Up** (не Exit, не Restarting). Если **backend** или **frontend** упали — смотрите логи:
  ```bash
  docker compose logs backend --tail 100
  docker compose logs frontend --tail 50
  ```
- Часто backend падает из‑за БД (не готова) или RPC (не доступен с контейнера). Проверьте:
  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://172.17.0.1:8545 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
  ```
  Должен вернуться `200`. Если нет — в `envs/common-blockscout.env` проверьте `ETHEREUM_JSONRPC_HTTP_URL` (для доступа с контейнера к RPC на хосте обычно `http://172.17.0.1:8545/` или IP шлюза Docker).

Поднять всё заново и подождать 1–2 минуты (индексер запускается):

```bash
cd /root/blockscout/docker-compose
docker compose down
docker compose up -d
sleep 90
curl -s "http://127.0.0.1:4000/api/v2/blocks?limit=1" | head -c 300
```

Если после этого по-прежнему 502 — пришлите вывод `docker compose ps` и последние строки `docker compose logs backend`.

**В логах proxy видно `upstream: "http://172.x.x.x:3000/"` и "Connection refused" или "No route to host".**  
Это значит: nginx не достучался до **frontend** (порт 3000). Контейнер frontend либо перезапускается (новый IP), либо ещё не слушает 3000. Сделайте по порядку:

```bash
cd /root/blockscout/docker-compose
# Почему падает фронт (если падает)
docker compose logs frontend --tail 80
# Поднять фронт, подождать пока поднимется, перезапустить proxy чтобы nginx подхватил актуальный IP фронта
docker compose up -d frontend
sleep 25
docker compose restart proxy
```
Через 10–15 сек откройте в браузере http://82.26.171.108:4000. Если frontend снова перезапускается — смотрите логи (`docker compose logs frontend`), возможны нехватка памяти (OOM) или ошибка в env.

---

## Если на главной всё ещё «No data»

**Чеклист на сервере (выполнить по порядку):**

```bash
# 1. Обновить репо и скопировать оба env
cd /root/demochain && git pull origin main
cp /root/demochain/docs/blockscout-demochain.env /root/blockscout/docker-compose/envs/common-blockscout.env
cp /root/demochain/docs/blockscout-frontend-demochain.env /root/blockscout/docker-compose/envs/common-frontend.env

# 2. Убедиться, что порт proxy 4000 (в services/nginx.yml: published: 4000)
# 3. Пересоздать фронт и поднять стек
cd /root/blockscout/docker-compose
docker compose up -d --force-recreate frontend

# 4. На сервере проверить, что API отдаёт блоки (этот curl выполнять по SSH на сервере, не в браузере)
curl -s "http://127.0.0.1:4000/api/v2/blocks?limit=1" | head -c 200
```

Если `curl` возвращает JSON с блоками, а в браузере по-прежнему «No data»:

- Откройте эксплорер в браузере, F12 → вкладка **Network** (Сеть), обновите страницу.
- Найдите запрос к `blocks`, `stats` или `transactions` — посмотрите **Request URL**. Если там не `http://82.26.171.108:4000/...`, а другой домен (например `blockscout.com`), образ фронта собран с зашитым API host; переменные из `common-frontend.env` в этом случае не подхватываются при запуске. Решение: пересобрать образ фронта Blockscout с нужным env (см. репозиторий blockscout/blockscout и сборку frontend) или использовать образ, собранный с вашим `NEXT_PUBLIC_API_HOST`.
