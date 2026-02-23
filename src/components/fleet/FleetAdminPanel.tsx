import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { supabase as supabaseClient } from '@/integrations/supabase/client';
const db = supabaseClient as any;
import { useToast } from '@/hooks/use-toast';
import { MapPin, Navigation, Route, Clock, Users, Eye, Fuel } from 'lucide-react';
import FleetMap from './FleetMap';
import FuelAdminPanel from './FuelAdminPanel';

interface Employee {
  id: string;
  name: string;
  role: string | null;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
}

interface Trip {
  id: string;
  employee_id: string;
  vehicle_id: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  description: string | null;
}

interface TripLocation {
  id: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  recorded_at: string;
}

export default function FleetAdminPanel() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [completedTrips, setCompletedTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [tripLocations, setTripLocations] = useState<TripLocation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tab, setTab] = useState<'live' | 'history' | 'fuel'>('live');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const channel = db
      .channel('fleet-tracking')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trip_locations' }, (payload: any) => {
        const newLoc = payload.new as TripLocation;
        setTripLocations((prev: TripLocation[]) => {
          if (selectedTripId === newLoc.trip_id || activeTrips.some(t => t.id === newLoc.trip_id)) {
            return [...prev, newLoc];
          }
          return prev;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { db.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (tab === 'live' && activeTrips.length > 0) {
      fetchActiveLocations();
    }
  }, [activeTrips, tab]);

  const fetchData = async () => {
    setLoading(true);
    const [empRes, activeRes, completedRes, vehRes] = await Promise.all([
      db.from('employees').select('id, name, role').eq('active', true),
      db.from('trips').select('*').eq('status', 'active').order('started_at', { ascending: false }),
      db.from('trips').select('*').eq('status', 'completed').order('ended_at', { ascending: false }).limit(50),
      db.from('vehicles').select('id, plate, model').eq('active', true),
    ]);
    if (empRes.data) setEmployees(empRes.data);
    if (activeRes.data) setActiveTrips(activeRes.data);
    if (completedRes.data) setCompletedTrips(completedRes.data);
    if (vehRes.data) setVehicles(vehRes.data);
    setLoading(false);
  };

  const fetchActiveLocations = async () => {
    const tripIds = activeTrips.map(t => t.id);
    if (tripIds.length === 0) return;
    const { data } = await db
      .from('trip_locations')
      .select('*')
      .in('trip_id', tripIds)
      .order('recorded_at', { ascending: true });
    if (data) setTripLocations(data);
  };

  const viewTripRoute = async (tripId: string) => {
    setSelectedTripId(tripId);
    const { data } = await db
      .from('trip_locations')
      .select('*')
      .eq('trip_id', tripId)
      .order('recorded_at', { ascending: true });
    if (data) setTripLocations(data);
  };

  const getEmployeeName = (empId: string) =>
    employees.find(e => e.id === empId)?.name || 'Desconhecido';

  const getVehiclePlate = (vehId: string | null) => {
    if (!vehId) return null;
    const v = vehicles.find(v => v.id === vehId);
    return v ? `${v.plate} — ${v.model}` : null;
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const calcDuration = (start: string, end: string | null) => {
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : Date.now();
    const mins = Math.round((e - s) / 60000);
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  };

  const tabClass = (t: string) =>
    `px-6 py-3 rounded-xl font-bold text-sm transition-all ${tab === t ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-card text-muted-foreground hover:bg-muted'}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Navigation className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 overflow-auto h-full">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <Navigation className="w-8 h-8 text-primary" />
            Frota - Rastreamento
          </h1>
          <p className="text-muted-foreground mt-1">Acompanhe seus motoristas em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
            <p className="text-xs text-primary font-bold">Viagens Ativas</p>
            <p className="text-xl font-black text-primary">{activeTrips.length}</p>
          </div>
        </div>
      </header>

      <div className="flex gap-3">
        <button className={tabClass('live')} onClick={() => { setTab('live'); setSelectedTripId(null); fetchActiveLocations(); }}>
          <MapPin className="w-4 h-4 inline mr-2" />Tempo Real
        </button>
        <button className={tabClass('history')} onClick={() => { setTab('history'); setSelectedTripId(null); setTripLocations([]); }}>
          <Route className="w-4 h-4 inline mr-2" />Histórico
        </button>
        <button className={tabClass('fuel')} onClick={() => setTab('fuel')}>
          <Fuel className="w-4 h-4 inline mr-2" />Combustível
        </button>
      </div>

      {tab !== 'fuel' && (
        <div className="bg-card rounded-2xl shadow-lg overflow-hidden" style={{ height: '450px' }}>
          <Suspense fallback={<div className="flex items-center justify-center h-full"><Navigation className="w-8 h-8 text-primary animate-spin" /></div>}>
            <FleetMap locations={tripLocations} />
          </Suspense>
        </div>
      )}

      {tab === 'live' && (
        <div className="bg-card rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Motoristas em Viagem
          </h3>
          <div className="space-y-3">
            {activeTrips.map(trip => {
              const lastLoc = tripLocations
                .filter(l => l.trip_id === trip.id)
                .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
              return (
                <div key={trip.id} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <div>
                      <p className="font-bold text-foreground">{getEmployeeName(trip.employee_id)}</p>
                      <p className="text-xs text-muted-foreground">
                        {getVehiclePlate(trip.vehicle_id) && <span className="text-primary font-bold mr-2">🚗 {getVehiclePlate(trip.vehicle_id)}</span>}
                        Início: {formatTime(trip.started_at)} • Duração: {calcDuration(trip.started_at, null)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {lastLoc && (
                      <span className="text-xs text-muted-foreground">
                        Último GPS: {formatTime(lastLoc.recorded_at)}
                      </span>
                    )}
                    <button
                      onClick={() => viewTripRoute(trip.id)}
                      className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" /> Ver Rota
                    </button>
                  </div>
                </div>
              );
            })}
            {activeTrips.length === 0 && (
              <p className="text-center text-muted-foreground py-6">Nenhum motorista em viagem no momento</p>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-card rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Histórico de Viagens
          </h3>
          <div className="space-y-2 max-h-80 overflow-auto">
            {completedTrips.map(trip => (
              <div key={trip.id} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors ${
                selectedTripId === trip.id ? 'bg-primary/10 border border-primary/20' : 'bg-muted hover:bg-muted/80'
              }`}
                onClick={() => viewTripRoute(trip.id)}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-bold text-foreground">{getEmployeeName(trip.employee_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {getVehiclePlate(trip.vehicle_id) && <span className="text-primary font-bold mr-1">🚗 {getVehiclePlate(trip.vehicle_id)} • </span>}
                      {formatTime(trip.started_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-foreground">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {calcDuration(trip.started_at, trip.ended_at)}
                  </span>
                  <Eye className="w-4 h-4 text-primary" />
                </div>
              </div>
            ))}
            {completedTrips.length === 0 && (
              <p className="text-center text-muted-foreground py-6">Nenhuma viagem registrada</p>
            )}
          </div>
        </div>
      )}

      {tab === 'fuel' && (
        <Suspense fallback={<div className="flex items-center justify-center h-32"><Fuel className="w-6 h-6 text-orange-500 animate-spin" /></div>}>
          <FuelAdminPanel />
        </Suspense>
      )}
    </div>
  );
}
