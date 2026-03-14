/**
 * gpsTracker.ts
 *
 * Singleton GPS tracker that runs OUTSIDE React component lifecycle.
 * This ensures GPS tracking continues even when the DriverTripPanel
 * component unmounts (e.g., user navigates to another tab).
 */

import { Geolocation } from '@capacitor/geolocation';
import { supabase as supabaseClient } from '@/integrations/supabase/client';

const db = supabaseClient as any;

const SESSION_KEY = 'gps_active_trip_id';
const PENDING_QUEUE_KEY = 'gps_pending_locations_v1';
const INTERVAL_MS = 30000; // 30 seconds
const MAX_QUEUE_SIZE = 200;

let currentTripId: string | null = null;
let intervalId: any = null;
let onLocationSaved: (() => void) | null = null;

export interface GpsLogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface LocationPayload {
  trip_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  recorded_at: string;
}

let gpsDebugLog: GpsLogEntry[] = [];
let pendingQueue: LocationPayload[] = [];

const MAX_LOG_SIZE = 50;

function addLog(message: string, type: GpsLogEntry['type'] = 'info') {
  const entry = { timestamp: new Date().toLocaleTimeString(), message, type };
  gpsDebugLog.unshift(entry);
  if (gpsDebugLog.length > MAX_LOG_SIZE) gpsDebugLog.pop();
  console.log(`[GPSTracker] ${message}`);
}

function loadPendingQueue() {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      pendingQueue = parsed
        .filter((item) => item && item.trip_id && Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
        .slice(-MAX_QUEUE_SIZE);

      if (pendingQueue.length > 0) {
        addLog(`📦 ${pendingQueue.length} ponto(s) pendente(s) recuperado(s)`, 'info');
      }
    }
  } catch {
    pendingQueue = [];
  }
}

function persistPendingQueue() {
  try {
    if (pendingQueue.length === 0) {
      localStorage.removeItem(PENDING_QUEUE_KEY);
      return;
    }

    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(pendingQueue.slice(-MAX_QUEUE_SIZE)));
  } catch {
    // Ignore storage errors silently
  }
}

function enqueueLocation(payload: LocationPayload) {
  pendingQueue.push(payload);
  if (pendingQueue.length > MAX_QUEUE_SIZE) {
    pendingQueue = pendingQueue.slice(-MAX_QUEUE_SIZE);
  }

  persistPendingQueue();
  addLog(`📥 Ponto enfileirado para reenvio (${pendingQueue.length})`, 'info');
}

async function flushPendingQueue() {
  if (pendingQueue.length === 0) return;

  const batch = [...pendingQueue];
  const { error } = await db.from('trip_locations').insert(batch);

  if (error) {
    addLog(`Falha no reenvio da fila: ${error.message || JSON.stringify(error)}`, 'error');
    return;
  }

  pendingQueue = [];
  persistPendingQueue();
  addLog(`✅ ${batch.length} ponto(s) pendente(s) reenviado(s)`, 'success');
}

function buildLocationPayload(tripId: string, position: GeolocationPosition): LocationPayload {
  const accuracy = typeof position.coords.accuracy === 'number' ? position.coords.accuracy : null;
  const speed = typeof position.coords.speed === 'number' ? position.coords.speed : null;

  return {
    trip_id: tripId,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy,
    speed,
    recorded_at: new Date().toISOString(),
  };
}

async function sendLocation(tripId: string) {
  try {
    await flushPendingQueue();

    addLog('Iniciando captura de posição...');
    let pos: GeolocationPosition;

    try {
      pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
    } catch {
      addLog('Alta precisão falhou, tentando modo econômico...', 'info');
      pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
      });
    }

    const payload = buildLocationPayload(tripId, pos);
    const accLabel = payload.accuracy !== null ? `${payload.accuracy.toFixed(0)}m` : 'n/d';
    addLog(`Salvando posição em ${tripId.slice(0, 8)}... (acc: ${accLabel})`);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueueLocation(payload);
      addLog('Sem internet no momento. Posição guardada para reenvio.', 'error');
      return;
    }

    const { error } = await db.from('trip_locations').insert(payload);

    if (error) {
      enqueueLocation(payload);
      addLog(`Erro ao salvar no banco, enfileirando: ${error.message || JSON.stringify(error)}`, 'error');
      return;
    }

    addLog('Posição salva com sucesso!', 'success');
    onLocationSaved?.();
  } catch (err: any) {
    const errorMsg = err?.message || JSON.stringify(err);
    addLog(`Falha total de rede/servidor: ${errorMsg}`, 'error');
    if (errorMsg.includes('Failed to fetch')) {
      addLog('DICA: Verifique internet e possíveis bloqueios de rede no celular.', 'error');
    }
  }
}

loadPendingQueue();

export const gpsTracker = {
  /** Start tracking for a trip. Safe to call multiple times — idempotent. */
  start(tripId: string, callback?: () => void) {
    if (currentTripId === tripId && intervalId !== null) {
      onLocationSaved = callback || null;
      void flushPendingQueue();
      return;
    }

    this.stop();
    currentTripId = tripId;
    onLocationSaved = callback || null;

    try {
      sessionStorage.setItem(SESSION_KEY, tripId);
    } catch {
      // Ignore sessionStorage failures
    }

    addLog(`🚀 Iniciando rastreamento para viagem ${tripId.slice(0, 8)}`);
    void sendLocation(tripId);
    intervalId = setInterval(() => {
      void sendLocation(tripId);
    }, INTERVAL_MS);
  },

  /** Stop tracking entirely (call only when trip ends). */
  stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    if (currentTripId) {
      addLog(`🛑 Parando rastreamento para viagem ${currentTripId.slice(0, 8)}`);
    }

    currentTripId = null;
    onLocationSaved = null;

    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore sessionStorage failures
    }
  },

  setCallback(callback: () => void) {
    onLocationSaved = callback;
  },

  forceSyncPending() {
    void flushPendingQueue();
  },

  getActiveTripId(): string | null {
    return currentTripId;
  },

  isTracking(): boolean {
    return intervalId !== null;
  },

  getLogs(): GpsLogEntry[] {
    return gpsDebugLog;
  },

  clearLogs() {
    gpsDebugLog = [];
  },
};
