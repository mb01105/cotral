# @cotral/server

<div align="center">
  <img src="../../logo.png" alt="Cotral" width="200">
</div>

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/fastify-%23000000.svg?style=for-the-badge&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](../../LICENSE)

**API REST per i dati del trasporto pubblico Cotral**

[Documentazione OpenAPI](./OpenAPI.yaml) · [Issue tracker](https://github.com/ChromuSx/cotral/issues)

</div>

> Pacchetto del [monorepo Cotral](../../README.md). Per installazione e build dell'intero stack vedi il README di root.

## Cosa fa

Fornisce un'API REST unificata sopra due fonti dati:

- **GTFS Cotral** (offline) — fermate, paline, percorsi, destinazioni. Caricato in memoria all'avvio (~14k fermate, ~4.3k linee). Auto-refresh quando i file vengono aggiornati.
- **API XML Cotral** (online) — transiti real-time, posizioni veicoli. Usata anche come fallback quando il GTFS non basta.

I preferiti per utente sono persistiti in SQLite (`better-sqlite3`).

## Stack

| Tecnologia | Utilizzo |
|------------|----------|
| **TypeScript** | Linguaggio principale |
| **Fastify** | Framework HTTP |
| **better-sqlite3** | Storage preferiti |
| **Axios** + **xml2js** | Client per le API XML Cotral |
| **adm-zip** | Estrazione archivio GTFS |
| **Vitest** | Test |

## Configurazione

Variabili d'ambiente (in `packages/server/.env` per sviluppo locale, oppure passate dal `docker-compose.yml`):

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `PORT` | `3000` | Porta HTTP |
| `HOST` | `127.0.0.1` | Interfaccia di bind (`0.0.0.0` in Docker) |
| `DB_PATH` | `./database.sqlite` | Path SQLite dei preferiti |
| `GTFS_PATH` | `./GTFS_COTRAL` | Cartella dove vivono i file GTFS estratti |
| `GTFS_URL` | URL ufficiale Cotral | Da dove scaricare l'archivio GTFS |
| `COTRAL_BASE_URL` | URL ufficiale Cotral | Endpoint XML real-time |
| `COTRAL_USER_ID` | preset | Token utente per le API XML (è quello pubblico dell'app Cotral) |
| `COTRAL_DELTA` | `261` | Parametro proprietario `pDelta` richiesto dall'API XML — finestra in minuti per la lookahead dei transiti |
| `TZ` | (host) | In Docker è `Europe/Rome`, necessaria perché tutti i timestamp sono trattati come ora locale italiana |

I file GTFS vengono scaricati automaticamente al primo avvio se `GTFS_PATH` non esiste (~52 MB).

## Avvio

Dalla root del monorepo:

```bash
npm run start:server
```

Oppure dentro al pacchetto:

```bash
cd packages/server
npm start
```

In avvio il server:
1. Inizializza il DB SQLite e crea la tabella `favorite_poles` se manca
2. Verifica i file GTFS, li scarica se assenti
3. Carica le tabelle GTFS in memoria
4. Espone le route HTTP

## API endpoints

### Località

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/localities/search?query=X&limit=N` | Autocompletamento località (max 25) |

### Fermate (Stops)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/stops/{locality}` | Tutte le fermate di una località |
| GET | `/stops/firststop/{locality}` | Prima fermata di una località |

### Paline (Poles)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/poles/position?latitude=X&longitude=Y&range=R` | Paline per posizione GPS |
| GET | `/poles/destinations/{arrivalLocality}` | Destinazioni servite da una località |
| GET | `/poles/{arrival}/{destination}` | Paline che servono un percorso |
| GET | `/poles/{stopCode}` | Paline associate a una fermata GTFS |
| GET | `/poles/favorites/{userId}` | Paline preferite di un utente |
| POST | `/poles/favorites` | Aggiunge un preferito (`{userId, poleCode, poleLat, poleLon}`) |
| DELETE | `/poles/favorites` | Rimuove un preferito (`{userId, poleCode}`) |

### Transiti (Transits)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/transits/{poleCode}` | Transiti per palina (real-time + schedulati) |

### Veicoli (Vehicles)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/vehiclerealtimepositions/{vehicleCode}` | Posizione GPS di un veicolo |

Schemi e parametri completi: [`OpenAPI.yaml`](./OpenAPI.yaml).

## Architettura

```
src/
├── controllers/        # binding HTTP (Fastify)
├── routes/             # registrazione controller
├── services/
│   ├── gtfsService.ts      # caricamento e query GTFS in memoria
│   ├── polesService.ts     # paline (GTFS primario, XML fallback)
│   ├── stopsService.ts     # fermate
│   ├── transitsService.ts  # transiti real-time (XML)
│   └── vehiclesService.ts  # posizioni veicoli (XML)
├── utils/
│   ├── cotralApi.ts        # client XML Cotral con normalizzazione
│   ├── gtfsDownloader.ts   # download e watch dell'archivio GTFS
│   └── timeUtils.ts        # formattazione tempi
├── config.ts           # config centralizzata da env
├── database.ts         # gestione SQLite
└── app.ts              # entry point Fastify
```

## Note tecniche peculiari

Cose strane delle API Cotral che il server gestisce trasparentemente:

- **`cmd=5` rotto**: l'endpoint XML "paline per fermata" non restituisce mai dati. Il workaround è prendere le coordinate dal GTFS e usare `cmd=7` (paline per posizione GPS). Vedi `polesService.getPolesByStopCode`.
- **lat/lon invertiti in `cmd=1`**: l'API restituisce latitudine e longitudine swap per molte paline. `normalizeLatLon` in `utils/cotralApi.ts` corregge euristicamente quando lat < 20.
- **`dataModifica` non è un timestamp**: è un numero opaco proprietario, non interpretabile come "X secondi fa". Per la freschezza dei dati i bot usano i flag `monitorata` + `automezzo.isAlive` (vedi [`getTransitTrackingStatus`](../shared/src/utils/transitStatus.ts)).
- **`ritardo=00:00` su corse non monitorate** è il valore di default, non un dato reale. I bot lo nascondono quando `monitorata!=1`.
- **Auto-reload GTFS**: i file vengono ricontrollati periodicamente; se aggiornati, le tabelle in memoria vengono ricaricate atomicamente senza downtime.

## Test

```bash
npm test                  # dalla root del monorepo
npm run test:server       # solo questo pacchetto
```

## Licenza

MIT — vedi [LICENSE](../../LICENSE).
