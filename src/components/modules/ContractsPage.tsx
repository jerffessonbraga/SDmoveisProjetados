import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileSignature, Plus, Search, Edit, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import ContractGenerator from './ContractGenerator';

const db = supabase as any;

const ContractsPage: React.FC = () => {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ client_id: '', title: '', content: '', value: 0, status: 'rascunho', notes: '' });
  const [showGenerator, setShowGenerator] = useState<'contrato_servico' | 'ordem_servico' | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const [contRes, cliRes] = await Promise.all([
      db.from('contracts').select('*, clients(name, phone, email, address)').order('created_at', { ascending: false }),
      db.from('clients').select('id, name, phone, email, address').order('name'),
    ]);
    setContracts(contRes.data || []);
    setClients(cliRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: '⚠️ Título obrigatório', variant: 'destructive' }); return; }
    const payload = { ...form, client_id: form.client_id || null };
    if (editingId) {
      await db.from('contracts').update(payload).eq('id', editingId);
      toast({ title: '✅ Contrato atualizado' });
    } else {
      await db.from('contracts').insert(payload);
      toast({ title: '✅ Contrato criado' });
    }
    setShowForm(false);
    setEditingId(null);
    fetchData();
  };

  const statusColors: Record<string, string> = {
    rascunho: 'bg-gray-100 text-gray-600',
    ativo: 'bg-green-100 text-green-700',
    assinado: 'bg-blue-100 text-blue-700',
    cancelado: 'bg-red-100 text-red-700',
    finalizado: 'bg-purple-100 text-purple-700',
  };

  const filtered = contracts.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || (c.clients?.name || '').toLowerCase().includes(search.toLowerCase()));

  const openGenerator = (type: 'contrato_servico' | 'ordem_servico') => {
    setShowGenerator(type);
  };

  return (
    <div className="p-8 space-y-6 overflow-auto h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-gray-900 flex items-center gap-3">
            <FileSignature className="w-8 h-8 text-amber-500" />
            Contratos
          </h1>
          <p className="text-gray-500 mt-1">Gestão de contratos e ordens de serviço</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openGenerator('contrato_servico')} className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-3 rounded-2xl font-bold hover:from-amber-600 hover:to-amber-700 flex items-center gap-2 shadow-lg">
            <Sparkles className="w-5 h-5" /> Gerar Contrato (IA)
          </button>
          <button onClick={() => openGenerator('ordem_servico')} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-2xl font-bold hover:from-blue-600 hover:to-blue-700 flex items-center gap-2 shadow-lg">
            <Sparkles className="w-5 h-5" /> Gerar OS (IA)
          </button>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ client_id: '', title: '', content: '', value: 0, status: 'rascunho', notes: '' }); }} className="bg-gray-800 text-white px-5 py-3 rounded-2xl font-bold hover:bg-gray-900 flex items-center gap-2 shadow-lg">
            <Plus className="w-5 h-5" /> Manual
          </button>
        </div>
      </header>

      {/* Generator */}
      {showGenerator && (
        <ContractGenerator
          templateType={showGenerator}
          client={selectedClient || undefined}
          onClose={() => setShowGenerator(null)}
        />
      )}

      {/* Client selector for generator */}
      {showGenerator && !selectedClient && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-700 mb-2">Selecione um cliente para o contrato:</p>
          <div className="flex flex-wrap gap-2">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClient(c)}
                className="bg-white px-3 py-2 rounded-xl text-sm font-medium border border-amber-200 hover:bg-amber-100 hover:border-amber-400 transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {['rascunho', 'ativo', 'assinado', 'finalizado'].map(st => (
          <div key={st} className="bg-white rounded-2xl p-4 shadow-lg">
            <p className="text-xs text-gray-500 uppercase font-bold">{st.charAt(0).toUpperCase() + st.slice(1)}s</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{contracts.filter(c => c.status === st).length}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar contrato..." className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-lg">{editingId ? 'Editar' : 'Novo'} Contrato</h3>
          <div className="grid grid-cols-2 gap-4">
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Título *" className="p-3 rounded-xl border border-gray-200" />
            <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="p-3 rounded-xl border border-gray-200">
              <option value="">Selecionar Cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" value={form.value} onChange={e => setForm({...form, value: +e.target.value})} placeholder="Valor (R$)" className="p-3 rounded-xl border border-gray-200" />
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="p-3 rounded-xl border border-gray-200">
              <option value="rascunho">Rascunho</option><option value="ativo">Ativo</option><option value="assinado">Assinado</option><option value="cancelado">Cancelado</option><option value="finalizado">Finalizado</option>
            </select>
          </div>
          <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Conteúdo do contrato" className="w-full p-3 rounded-xl border border-gray-200" rows={4} />
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Observações" className="w-full p-3 rounded-xl border border-gray-200" rows={2} />
          <div className="flex gap-3">
            <button onClick={handleSave} className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-700">Salvar</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 text-xs font-black text-gray-500 uppercase">#</th>
              <th className="text-left p-4 text-xs font-black text-gray-500 uppercase">Título</th>
              <th className="text-left p-4 text-xs font-black text-gray-500 uppercase">Cliente</th>
              <th className="text-left p-4 text-xs font-black text-gray-500 uppercase">Valor</th>
              <th className="text-left p-4 text-xs font-black text-gray-500 uppercase">Status</th>
              <th className="text-left p-4 text-xs font-black text-gray-500 uppercase">Data</th>
              <th className="text-left p-4 text-xs font-black text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-400">#{c.contract_number}</td>
                <td className="p-4 font-bold text-gray-900">{c.title}</td>
                <td className="p-4 text-gray-600">{c.clients?.name || '-'}</td>
                <td className="p-4 font-bold text-amber-600">R$ {(c.value || 0).toLocaleString('pt-BR')}</td>
                <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[c.status] || ''}`}>{c.status}</span></td>
                <td className="p-4 text-sm text-gray-600">{format(new Date(c.created_at), 'dd/MM/yyyy')}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => { setEditingId(c.id); setForm({ client_id: c.client_id || '', title: c.title, content: c.content || '', value: c.value || 0, status: c.status, notes: c.notes || '' }); setShowForm(true); }} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">{loading ? 'Carregando...' : 'Nenhum contrato encontrado'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractsPage;
