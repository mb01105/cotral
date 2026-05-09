# @cotral/discord-bot

<div align="center">
  <img src="../../logo.png" alt="Cotral" width="200">
</div>

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![discord.js](https://img.shields.io/badge/discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](../../LICENSE)

**Bot Discord per il trasporto pubblico Cotral**

</div>

> Pacchetto del [monorepo Cotral](../../README.md). Per installazione, build e deploy vedi il README di root.

## Cosa fa

Bot Discord (discord.js) che parla col [`@cotral/server`](../server) e offre la stessa esperienza del bot Telegram, adattata alle primitive Discord:

- **Slash commands** per ogni funzione
- **Autocompletamento** delle località (chiama l'endpoint `/localities/search`)
- **Select menu** per scegliere tra più paline / transiti
- **Bottoni** per refresh, salto al dettaglio, gestione preferiti
- **Embed** colorati in base allo stato (real-time, ritardo, schedulato)
- **Opzione `privato`** su ogni comando: rende la risposta visibile solo a chi l'ha invocata (ephemeral)

### Funzionalità chiave

- **Stato real-time vs schedulato** sui transiti: badge a 3 stati (Real-time / Tracciata / Schedulata) basato sui flag Cotral `monitorata` e `automezzo.isAlive`. Il ritardo viene riportato solo quando è effettivamente reale; il footer dell'embed riassume "N real-time, M schedulate".
- **Preferiti con destinazione** — la lista `/preferiti` mostra le destinazioni servite da ogni palina nel select menu, così paline omonime (es. due lati di "Abbazia di Casamari") sono distinguibili a colpo d'occhio.
- **Allowlist utenti** — `DISCORD_ALLOWED_USER_IDS` per limitare il bot a un set di Discord user ID.

## Configurazione

Variabili d'ambiente (in `packages/discord-bot/.env` per dev locale, oppure dal `docker-compose.yml`):

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `DISCORD_BOT_TOKEN` | — | Token del bot dal [Developer Portal](https://discord.com/developers/applications) |
| `DISCORD_CLIENT_ID` | — | Application ID del bot (per registrare gli slash commands) |
| `API_BASE_URL` | `http://localhost:3000` | URL del `@cotral/server` |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |
| `ALLOWED_USER_IDS` | (vuoto) | Lista CSV di Discord user ID; vuoto = aperto a tutti |
| `TZ` | (host) | In Docker è `Europe/Rome` |

## Avvio

```bash
# Dalla root del monorepo, prima volta o dopo aver modificato i comandi:
npm run deploy-commands:discord

# Avvio del bot:
npm run start:discord-bot
```

`deploy-commands` registra/aggiorna gli slash commands su Discord — va eseguito quando si aggiunge/modifica un comando, NON ad ogni avvio. In Docker, `deploy.sh` lo invoca automaticamente come ultimo step del deploy.

## Slash commands

| Comando | Descrizione |
|---------|-------------|
| `/paline codice <codice>` | Cerca palina per codice |
| `/paline posizione <lat> <lon>` | Cerca paline vicine a una posizione |
| `/paline percorso <partenza> <destinazione>` | Cerca paline per percorso (autocomplete) |
| `/paline destinazioni <località>` | Tutte le destinazioni servite da una località |
| `/transiti <codice>` | Transiti real-time per palina |
| `/fermate cerca <località>` | Fermate di una località (autocomplete) |
| `/fermate prima <località>` | Prima fermata di una località (autocomplete) |
| `/veicoli <codice>` | Posizione GPS di un veicolo |
| `/preferiti` | Le tue paline preferite |
| `/help` | Riepilogo comandi |

Ogni comando accetta `privato: True` per rispondere in modalità ephemeral.

## Architettura

```
src/
├── bot/
│   ├── bot.ts              # init client, allowlist, dispatcher interaction
│   └── deploy-commands.ts  # registra gli slash commands su Discord
├── commands/               # un file per slash command
├── handlers/
│   └── interactionHandler.ts  # router per bottoni e select menu
├── apiHandlers/            # client del server API + builder embed/component
├── services/
│   ├── axiosService.ts     # client HTTP verso il server API
│   └── autocompleteService.ts # località → suggerimenti per Discord
├── utils/
│   ├── formatting.ts       # emoji, colori embed, helper formattazione
│   └── logger.ts           # logging strutturato
├── config.ts               # config centralizzata da env
└── app.ts                  # entry point
```

## Test

```bash
npm test                       # dalla root del monorepo
npm run test:discord-bot       # solo questo pacchetto
```

## Licenza

MIT — vedi [LICENSE](../../LICENSE).
