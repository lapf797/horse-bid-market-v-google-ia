
import React, { useState, useEffect } from 'react';
import { AuctionEvent, HorseLot, UserProfile, UserStatus, AuctionStatus, SellerSubmission } from '../types';
import { DEFAULT_PAYMENT_CONFIGS } from '../services/mockData';
import { 
    streamAllUsers, updateUserStatus, createAuctionEvent, 
    updateAuctionEvent, streamSubmissions, approveSubmission,
    createHorseLot, updateHorseLot
} from '../services/gcp';

interface Props {
  events: AuctionEvent[];
  lots: HorseLot[];
  onNavigateHome: () => void;
}

const AdminDashboard: React.FC<Props> = ({ events, lots, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'EVENTS' | 'LOTS' | 'USERS' | 'SUBMISSIONS'>('DASHBOARD');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [submissions, setSubmissions] = useState<SellerSubmission[]>([]);
  
  const [eventModal, setEventModal] = useState<{ isOpen: boolean; event: Partial<AuctionEvent> | null }>({ isOpen: false, event: null });
  const [lotModal, setLotModal] = useState<{ isOpen: boolean; lot: Partial<HorseLot> | null }>({ isOpen: false, lot: null });
  const [curationModal, setCurationModal] = useState<{ isOpen: boolean; sub: SellerSubmission | null }>({ isOpen: false, sub: null });

  useEffect(() => {
    const unsubUsers = streamAllUsers(setUsers);
    const unsubSubs = streamSubmissions(setSubmissions);
    return () => { unsubUsers(); unsubSubs(); };
  }, []);

  const formatCurrency = (val: number) => val?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEvent = async () => {
    if (!eventModal.event) return;
    const data = {
        ...eventModal.event,
        startTime: eventModal.event.startTime ? new Date(eventModal.event.startTime) : new Date(),
        endTime: eventModal.event.endTime ? new Date(eventModal.event.endTime) : new Date(),
    };
    if (eventModal.event.id) {
        await updateAuctionEvent(eventModal.event.id, data);
    } else {
        await createAuctionEvent({ ...data, status: AuctionStatus.ACTIVE });
    }
    setEventModal({ isOpen: false, event: null });
  };

  const handleSaveLot = async () => {
    if (!lotModal.lot) return;
    const lotData = {
        ...lotModal.lot,
        currentPrice: lotModal.lot.startPrice || 0,
        endTime: lotModal.lot.endTime ? new Date(lotModal.lot.endTime) : new Date(Date.now() + 86400000)
    };
    if (lotModal.lot.id) {
        await updateHorseLot(lotModal.lot.id, lotData);
    } else {
        await createHorseLot(lotData);
    }
    setLotModal({ isOpen: false, lot: null });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-equus-navy text-white flex flex-col shadow-2xl h-screen sticky top-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-equus-gold rounded flex items-center justify-center font-serif font-bold text-equus-navy">H</div>
          <span className="font-serif font-bold tracking-widest text-sm">BACKOFFICE</span>
        </div>
        <nav className="flex-1 py-6 space-y-1">
          {[
            { id: 'DASHBOARD', label: 'Dashboard', icon: 'M4 6h16M4 12h16M4 18h16' },
            { id: 'EVENTS', label: 'Leilões', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'LOTS', label: 'Catálogo de Lotes', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { id: 'USERS', label: 'Compradores', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857' },
            { id: 'SUBMISSIONS', label: 'Curadoria', icon: 'M9 12l2 2 4-4', badge: submissions.filter(s => s.status === 'PENDING').length }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full px-6 py-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-equus-gold text-equus-navy' : 'hover:bg-white/5 text-gray-400'}`}>
              <span>{item.label}</span>
              {item.badge ? <span className="ml-auto bg-red-500 text-white px-2 py-0.5 rounded-full">{item.badge}</span> : null}
            </button>
          ))}
        </nav>
        <button onClick={onNavigateHome} className="p-6 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white border-t border-white/10">Voltar ao Site</button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-10 overflow-y-auto">
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-10 animate-fade-in">
            <h2 className="text-3xl font-serif font-bold text-equus-navy italic">Visão Geral</h2>
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: 'Leilões Ativos', value: events.length },
                { label: 'Total de Lotes', value: lots.length },
                { label: 'Compradores', value: users.length },
                { label: 'Lances Efetuados', value: lots.reduce((acc, l) => acc + (l.bids?.length || 0), 0) }
              ].map((s, i) => (
                <div key={i} className="bg-white p-8 rounded shadow-sm border-l-4 border-equus-gold">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</span>
                  <div className="text-3xl font-bold text-equus-navy mt-1">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'EVENTS' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif font-bold text-equus-navy italic">Gestão de Leilões</h2>
              <button onClick={() => setEventModal({ isOpen: true, event: { startTime: new Date(), endTime: new Date(Date.now() + 86400000) } })} className="bg-equus-navy text-white px-6 py-3 rounded-sm font-bold uppercase text-[10px] tracking-widest hover:bg-equus-gold transition-all">+ Novo Leilão</button>
            </div>
            <div className="bg-white rounded shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b text-[9px] uppercase font-bold text-gray-400 tracking-widest">
                  <tr>
                    <th className="p-4">Capa</th>
                    <th className="p-4">Título</th>
                    <th className="p-4">Data Início</th>
                    <th className="p-4">Lotes</th>
                    <th className="p-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.map(e => (
                    <tr key={e.id} className="text-sm">
                      <td className="p-4"><img src={e.coverImage} className="w-12 h-8 object-cover rounded" /></td>
                      <td className="p-4 font-bold text-equus-navy">{e.title}</td>
                      <td className="p-4 text-xs">{new Date(e.startTime as any).toLocaleDateString()}</td>
                      <td className="p-4 text-equus-gold font-bold">{lots.filter(l => l.auctionId === e.id).length}</td>
                      <td className="p-4">
                        <button onClick={() => setEventModal({ isOpen: true, event: e })} className="text-xs font-bold uppercase text-gray-400 hover:text-equus-navy">Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'LOTS' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif font-bold text-equus-navy italic">Catálogo de Lotes</h2>
              <button onClick={() => setLotModal({ isOpen: true, lot: { lotNumber: lots.length + 1, installments: 30, incrementAmount: 500, startPrice: 1000, bids: [] } })} className="bg-equus-navy text-white px-6 py-3 rounded-sm font-bold uppercase text-[10px] tracking-widest hover:bg-equus-gold transition-all">+ Inserir Cavalo</button>
            </div>
            <div className="bg-white rounded shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b text-[9px] uppercase font-bold text-gray-400 tracking-widest">
                  <tr>
                    <th className="p-4">#</th>
                    <th className="p-4">Animal</th>
                    <th className="p-4">Leilão</th>
                    <th className="p-4">Preço Atual</th>
                    <th className="p-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lots.map(l => (
                    <tr key={l.id} className="text-sm">
                      <td className="p-4 font-mono text-gray-400">#{l.lotNumber}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={l.imageUrl} className="w-10 h-10 object-cover rounded-full" />
                          <span className="font-bold">{l.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-500 uppercase font-bold">
                        {events.find(e => e.id === l.auctionId)?.title || 'SEM LEILÃO'}
                      </td>
                      <td className="p-4 font-bold text-emerald-600">{formatCurrency(l.currentPrice)}</td>
                      <td className="p-4">
                        <button onClick={() => setLotModal({ isOpen: true, lot: l })} className="text-xs font-bold uppercase text-gray-400 hover:text-equus-navy">Ficha Técnica</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-serif font-bold text-equus-navy italic">Compradores</h2>
            <div className="bg-white rounded shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b text-[9px] uppercase font-bold text-gray-400 tracking-widest">
                  <tr>
                    <th className="p-4">Nome</th>
                    <th className="p-4">CPF</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.id} className="text-sm">
                      <td className="p-4 font-bold">{u.name}</td>
                      <td className="p-4 font-mono text-xs">{u.cpf}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${u.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {u.status !== 'APPROVED' && (
                          <button onClick={() => updateUserStatus(u.id, UserStatus.APPROVED)} className="text-[10px] font-bold uppercase text-emerald-600 hover:underline">Aprovar Cadastro</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL EVENTO */}
      {eventModal.isOpen && (
        <div className="fixed inset-0 bg-equus-navy/90 flex items-center justify-center z-[100] p-6 backdrop-blur-sm">
          <div className="bg-white p-10 max-w-xl w-full rounded-sm border-t-8 border-equus-gold">
            <h3 className="text-xl font-serif font-bold text-equus-navy mb-6 uppercase">Configurar Leilão</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Capa do Leilão (Upload)</label>
                <div className="relative h-32 border-2 border-dashed border-gray-200 rounded flex flex-col items-center justify-center overflow-hidden">
                    {eventModal.event?.coverImage ? <img src={eventModal.event.coverImage} className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-400">Clique para selecionar foto</span>}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (b) => setEventModal({...eventModal, event: {...eventModal.event, coverImage: b}}))} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Título</label>
                <input value={eventModal.event?.title || ''} onChange={e => setEventModal({...eventModal, event: {...eventModal.event, title: e.target.value}})} className="w-full p-3 border rounded text-sm" placeholder="Ex: Leilão Elite 2025" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Data Início</label>
                  <input type="datetime-local" className="w-full p-3 border rounded text-xs" onChange={e => setEventModal({...eventModal, event: {...eventModal.event, startTime: new Date(e.target.value)}})} />
                </div>
                <div>
                   <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Pagamento</label>
                   <select className="w-full p-3 border rounded text-xs" value={eventModal.event?.paymentConfigId || 'p1'} onChange={e => setEventModal({...eventModal, event: {...eventModal.event, paymentConfigId: e.target.value}})}>
                      {DEFAULT_PAYMENT_CONFIGS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <button onClick={() => setEventModal({ isOpen: false, event: null })} className="flex-1 py-3 text-[10px] font-bold uppercase text-gray-400">Cancelar</button>
              <button onClick={handleSaveEvent} className="flex-1 py-3 bg-equus-navy text-white text-[10px] font-bold uppercase tracking-widest shadow-xl">Salvar Leilão</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOTE */}
      {lotModal.isOpen && (
        <div className="fixed inset-0 bg-equus-navy/90 flex items-center justify-center z-[100] p-6 backdrop-blur-sm">
          <div className="bg-white p-10 max-w-4xl w-full rounded-sm border-t-8 border-equus-navy max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-serif font-bold text-equus-navy mb-8 uppercase">Ficha do Lote #{lotModal.lot?.lotNumber}</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Foto Principal (Upload)</label>
                  <div className="relative h-48 border-2 border-dashed border-gray-200 rounded flex flex-col items-center justify-center overflow-hidden">
                      {lotModal.lot?.imageUrl ? <img src={lotModal.lot.imageUrl} className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-400">Upload da Imagem</span>}
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (b) => setLotModal({...lotModal, lot: {...lotModal.lot, imageUrl: b}}))} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Vincular a Leilão</label>
                    <select value={lotModal.lot?.auctionId || ''} onChange={e => setLotModal({...lotModal, lot: {...lotModal.lot, auctionId: e.target.value}})} className="w-full p-3 border rounded text-xs bg-gray-50">
                        <option value="">Selecione...</option>
                        {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Nome do Cavalo</label>
                    <input value={lotModal.lot?.name || ''} onChange={e => setLotModal({...lotModal, lot: {...lotModal.lot, name: e.target.value}})} className="w-full p-3 border rounded text-sm font-bold" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div><label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Preço Inicial</label><input type="number" value={lotModal.lot?.startPrice || 0} onChange={e => setLotModal({...lotModal, lot: {...lotModal.lot, startPrice: Number(e.target.value)}})} className="w-full p-3 border rounded text-sm" /></div>
                   <div><label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Incremento</label><input type="number" value={lotModal.lot?.incrementAmount || 500} onChange={e => setLotModal({...lotModal, lot: {...lotModal.lot, incrementAmount: Number(e.target.value)}})} className="w-full p-3 border rounded text-sm" /></div>
                </div>
                <div>
                   <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Descrição</label>
                   <textarea value={lotModal.lot?.description || ''} onChange={e => setLotModal({...lotModal, lot: {...lotModal.lot, description: e.target.value}})} className="w-full p-3 border rounded text-xs h-32 resize-none" />
                </div>
              </div>
            </div>
            <div className="mt-10 flex gap-4 border-t pt-6">
              <button onClick={() => setLotModal({ isOpen: false, lot: null })} className="flex-1 py-4 text-[10px] font-bold uppercase text-gray-400">Cancelar</button>
              <button onClick={handleSaveLot} className="flex-1 py-4 bg-equus-navy text-white text-[10px] font-bold uppercase tracking-widest shadow-xl hover:bg-equus-gold transition-all">Salvar e Publicar Lote</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
