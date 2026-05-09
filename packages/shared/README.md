# @cotral/shared

Tipi TypeScript e utility condivise tra i pacchetti del [monorepo Cotral](../../README.md).

Niente runtime: serve solo per evitare che `server`, `telegram-bot` e `discord-bot` ridefiniscano gli stessi tipi e per concentrare in un solo posto la logica derivata dai dati Cotral.

## Cosa esporta

### Interfacce dei dati

| Tipo | Descrizione |
|------|-------------|
| `Pole` | Palina (codice, nome, coordinate, destinazioni servite, flag preferita) |
| `Stop` | Fermata GTFS (codice, nome, località, coordinate) |
| `Transit` | Corsa transitante per una palina (orari, stato, mezzo, ritardo) |
| `Vehicle` | Mezzo associato a una corsa (codice, `isAlive`) |
| `VehiclePosition` | Posizione GPS di un veicolo |

### Utility transit

| Export | Descrizione |
|--------|-------------|
| `TransitTrackingStatus` | Union type: `'realtime' \| 'monitored_offline' \| 'scheduled'` |
| `getTransitTrackingStatus(transit)` | Mappa i flag Cotral (`monitorata`, `automezzo.isAlive`) in uno stato leggibile |
| `isDelayInfoReliable(transit)` | `true` solo se `getTransitTrackingStatus(transit) === 'realtime'` — usato dai bot per decidere se mostrare il campo `ritardo` |

La logica di `getTransitTrackingStatus` esiste perché Cotral riempie `ritardo=00:00` di default anche su corse non tracciate: confondere "default" con "puntuale" porta a UX fuorvianti. Vedi i README di [`telegram-bot`](../telegram-bot/README.md) e [`discord-bot`](../discord-bot/README.md) per come viene presentato all'utente.

## Build

Solo emissione di `.d.ts` + `.js` (nessuna logica runtime di rilievo):

```bash
npm run build:shared    # dalla root del monorepo
```

Gli altri pacchetti dipendono da `@cotral/shared` via workspace, quindi il build viene incluso automaticamente in `npm run build`.

## Licenza

MIT — vedi [LICENSE](../../LICENSE).
