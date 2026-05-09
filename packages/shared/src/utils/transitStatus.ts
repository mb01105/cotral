import { Transit } from '../interfaces/Transit';

export type TransitTrackingStatus = 'realtime' | 'monitored_offline' | 'scheduled';

// Cotral exposes two flags that together describe how reliable a transit is:
//   - `monitorata` ("1"|"0"): the run supports real-time tracking
//   - `automezzo.isAlive`: the assigned bus is currently transmitting
// On non-monitored runs `ritardo` is always "00:00" by default — that is NOT
// a real punctuality reading, so callers should suppress delay info there.
export function getTransitTrackingStatus(transit: Transit): TransitTrackingStatus {
    if (transit.monitorata !== '1') return 'scheduled';
    return transit.automezzo?.isAlive ? 'realtime' : 'monitored_offline';
}

export function isDelayInfoReliable(transit: Transit): boolean {
    return getTransitTrackingStatus(transit) === 'realtime';
}
