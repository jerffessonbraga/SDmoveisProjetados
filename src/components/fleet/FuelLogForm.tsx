import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Fuel, Send, Loader2 } from 'lucide-react';

const db = supabase as any;

interface Vehicle {
  id: string;
  plate: string;
  model: string;
}

interface FuelLog {
  id: string;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  odometer: number | null;
  notes: string | null;
  created_at: string;
  vehicle_id: string;
}

export default function FuelLogForm({ employeeId, onClose }: { employeeId: string; onClose?: () => void }) {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [odometer, setOdometer] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchLogs();
  }, [employeeId]);

  const fetchVehicles = async () => {
    const { data } = await db.from('vehicles').select('id, plate, model').eq('active', true);
    if (data) setVehicles(data);
  };

  const fetchLogs = async () => {
    const { data } = await db
      .from('fuel_logs')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setLogs(data);
  };

  const totalCost = (parseFloat(liters) || 0) * (parseFloat(pricePerLiter) || 0);

  const submit = async () => {
    if (!vehicleId || !liters || !pricePerLiter) return;
    setSending(true);
    const { error } = await db.from('fuel_logs').insert({
      employee_id: employeeId,
      vehicle_id: vehicleId,
      liters: parseFloat(liters),
      price_per_liter: parseFloat(pricePerLiter),
      total_cost: totalCost,
      odometer: odometer ? parseFloat(odometer) : null,
      notes: notes.trim() || null,
    });
    setSending(false);
    if (error) {
      toast({ title: '❌ Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '⛽ Abastecimento registrado!' });
      setLiters(''); setPricePerLiter(''); setOdometer(''); setNotes('');
      fetchLogs();
      onClose?.();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 rounded-xl p-4 space-y-3 border border-orange-200">
        <p className="font-bold text-orange-800 text-sm flex items-center gap-2">
          <Fuel className="w-4 h-4" /> Registrar Abastecimento
        </p>
        <select
          value={vehicleId}
          onChange={e => setVehicleId(e.target.value)}
          className="w-full p-3 rounded-lg border border-orange-200 text-sm bg-white"
        >
          <option value="">Selecione o veículo...</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">Litros</label>
            <input
              type="number"
              value={liters}
              onChange={e => setLiters(e.target.value)}
              placeholder="Ex: 45"
              className="w-full p-3 rounded-lg border border-orange-200 bg-white text-sm mt-1"
              min="0.1"
              step="0.1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">R$/Litro</label>
            <input
              type="number"
              value={pricePerLiter}
              onChange={e => setPricePerLiter(e.target.value)}
              placeholder="Ex: 5.89"
              className="w-full p-3 rounded-lg border border-orange-200 bg-white text-sm mt-1"
              min="0.01"
              step="0.01"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase">Km Odômetro (opcional)</label>
          <input
            type="number"
            value={odometer}
            onChange={e => setOdometer(e.target.value)}
            placeholder="Ex: 85430"
            className="w-full p-3 rounded-lg border border-orange-200 bg-white text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase">Observação (opcional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Posto Shell BR-222"
            className="w-full p-3 rounded-lg border border-orange-200 bg-white text-sm mt-1"
          />
        </div>
        {totalCost > 0 && (
          <div className="bg-orange-100 rounded-lg p-3 text-center">
            <span className="text-sm text-orange-700">Total: </span>
            <span className="font-black text-orange-800 text-lg">R$ {totalCost.toFixed(2)}</span>
          </div>
        )}
        <button
          onClick={submit}
          disabled={sending || !vehicleId || !liters || !pricePerLiter}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Registrar Abastecimento
        </button>
      </div>

      {logs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-700">Últimos Abastecimentos</p>
          {logs.map(log => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
              <div>
                <span className="font-bold text-gray-900">{Number(log.liters).toFixed(1)}L</span>
                <span className="text-gray-500 ml-2">× R$ {Number(log.price_per_liter).toFixed(2)}</span>
                {log.odometer && <span className="text-gray-400 ml-2 text-xs">{Number(log.odometer).toLocaleString('pt-BR')} km</span>}
              </div>
              <span className="font-bold text-orange-700">R$ {Number(log.total_cost).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
