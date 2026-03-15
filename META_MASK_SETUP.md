# MetaMask: DemoChain BY (chainId 2026)

## Параметры сети

| Поле | Значение |
|------|----------|
| Network Name | DemoChain BY |
| RPC URL | `http://YOUR_IP:8545` или `http://demo.neotek.by:8545` |
| Chain ID | 2026 |
| Currency Symbol | ETH (или оставить пустым) |

## Шаги

1. MetaMask → Settings → Networks → Add network
2. Ввести параметры выше
3. Сохранить
4. Выбрать сеть DemoChain BY
5. Импортировать аккаунт с CONS (ключ от MINT_TO)

## Токен CONS

После деплоя ConsortiumToken:
- **Адрес контракта:** в `deployed.json` на сервере, поле `ConsortiumToken`. Узнать: `ssh root@82.26.171.108 "grep ConsortiumToken /root/demochain/deployed.json"`
- **Символ:** CONS
- **Decimals:** 18

В MetaMask: Assets → Import tokens → вставить адрес контракта, CONS, 18.
