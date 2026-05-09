# @cotral/telegram-bot

<div align="center">
  <img src="../../logo.png" alt="Cotral" width="200">
</div>

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Telegraf](https://img.shields.io/badge/Telegraf-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://telegraf.js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](../../LICENSE)

**Bot Telegram per il trasporto pubblico Cotral**

</div>

> Pacchetto del [monorepo Cotral](../../README.md). Per installazione, build e deploy vedi il README di root.

## Cosa fa

Bot Telegram (Telegraf) che parla col [`@cotral/server`](../server) per dare all'utente:

- ricerca paline (per codice, posizione GPS, percorso arrivo→destinazione, autocompletamento località)
- transiti real-time per palina
- posizione GPS dei veicoli
- gestione preferiti con accesso rapido dal menu

### Funzionalità chiave

- **Preferiti con destinazione mostrata** — quando hai due paline allo stesso indirizzo (lati opposti della strada) il bottone include la destinazione (`Abbazia di Casamari → Frosinone`) invece del codice opaco, così la disambiguazione è immediata.
- **Stato real-time vs schedulato** — sui transiti viene mostrato un badge a 3 stati (● real-time / ◐ tracciata-offline / ○ schedulata) basato sui flag Cotral `monitorata` e `automezzo.isAlive`. Il "ritardo" viene mostrato solo quando è realmente affidabile, evitando il fuorviante "🟢 Puntuale" sulle corse non tracciate.
- **Aggiornamento in posto** — il bottone "🔄 Aggiorna" rifà la query e riscrive il messaggio sulla stessa schermata, senza rumore in chat.
- **Allowlist utenti** — il bot può rispondere solo agli ID elencati in `ALLOWED_USER_IDS` (utile per istanze private).

## Configurazione

Variabili d'ambiente (in `packages/telegram-bot/.env` per dev locale, oppure dal `docker-compose.yml`):

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | — | Token ricevuto da [@BotFather](https://t.me/botfather) |
| `API_BASE_URL` | `http://localhost:3000` | URL del `@cotral/server` |
| `SESSION_DB_PATH` | `./session_db.json` | File JSON usato da `telegraf-session-local` |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |
| `ALLOWED_USER_IDS` | (vuoto) | Lista CSV di Telegram user ID; vuoto = aperto a tutti |
| `TZ` | (host) | In Docker è `Europe/Rome` (gli orari Cotral sono ora locale italiana) |

## Avvio

Dalla root del monorepo:

```bash
npm run start:telegram-bot
```

Il bot richiede che `@cotral/server` sia raggiungibile su `API_BASE_URL`.

## Comandi e menu

Il flusso normale è guidato dal menu inline e dalla keyboard, ma tutti i comandi sono accessibili anche via slash:

### Paline

| Comando | Descrizione |
|---------|-------------|
| `/getfavoritepoles` | Le tue paline preferite |
| `/getpolesbycode` | Cerca per codice |
| `/getpolesbyposition` | Cerca paline vicine (chiede la posizione GPS) |
| `/getpolebyarrivalanddestination` | Cerca per percorso arrivo→destinazione |
| `/getallpolesdestinationsbyarrival` | Tutte le destinazioni servite da una località |

### Fermate

| Comando | Descrizione |
|---------|-------------|
| `/getstopsbylocality` | Fermate di una località |
| `/getfirststopbylocality` | Prima fermata di una località |

### Transiti e veicoli

| Comando | Descrizione |
|---------|-------------|
| `/gettransitsbypolecode` | Transiti real-time per palina |
| `/getvehiclerealtimepositions` | Posizione GPS di un veicolo |

## Architettura

```
src/
├── bot/
│   ├── bot.ts              # init, menu principale, allowlist
│   ├── actions/            # handler menu/inline keyboard
│   └── handlers/           # dispatcher comandi, callback, location, errori
├── apiHandlers/            # client del server API + rendering messaggi
├── commands/               # enum dei nomi di comando
├── services/
│   └── axiosService.ts     # client HTTP verso il server API
├── utils/
│   ├── apiUtils.ts         # helper risposta API + rendering generico
│   ├── messageFormatting.ts # emoji, HTML, formattazione orari
│   ├── functions.ts        # validazione coordinate, chunking
│   └── logger.ts           # logging strutturato
└── app.ts                  # entry point
```

## Test

```bash
npm test                       # dalla root del monorepo
npm run test:telegram-bot      # solo questo pacchetto
```

## Licenza

MIT — vedi [LICENSE](../../LICENSE).
