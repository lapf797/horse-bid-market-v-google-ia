
import React, { useState } from 'react';
import { AuctionEvent, SellerSubmission, HorseLot, UserProfile, UserStatus, AuctionStatus, PaymentConfig } from '../types';
import { DEFAULT_PAYMENT_CONFIGS } from '../services/mockData';

interface Props {
  events: AuctionEvent[];
  lots: HorseLot[];
  users: UserProfile[];
  submissions: SellerSubmission[];
  onCreateEvent: (evt: AuctionEvent) => void;
  onUpdateEvent: (evt: AuctionEvent) => void;
  onCreateLot: (lot: HorseLot) => void;
  onUpdateLot: (lot: HorseLot) => void;
  onUpdateUserStatus: (userId: string, status: UserStatus) => void;
  onApproveSubmission: (subId: string, config: { eventId: string; startPrice: number; increment: number; lotNumber: number }) => void;
  onRejectSubmission: (subId: string) => void;
  onNavigateHome: () => void;
}

const AdminDashboard: React.FC<Props> = ({ 
  events, lots, users, submissions, 
  onCreateEvent, onUpdateEvent, onCreateLot, onUpdateLot, onUpdateUserStatus,
  onApproveSubmission, onRejectSubmission, onNavigateHome 
}) => {
  const [activeTab, setActiveTab] = useState<'SUBMISSIONS' | 'EVENTS' | 'LOTS' | 'USERS'>('SUBMISSIONS');
  
  // Modais
  const [eventModal, setEventModal] = useState<{ isOpen: boolean; event: Partial<AuctionEvent> | null }>({ isOpen: false, event: null });
  const [lotModal, setLotModal] = useState<{ isOpen: boolean; lot: Partial<HorseLot> | null }>({ isOpen: false, lot: null });
  const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; subId: string | null }>({ isOpen: false, subId: null });
  const [approveConfig, setApproveConfig] = useState({ eventId: events[0]?.id || '', startPrice: 0, increment: 500, lotNumber: 1 });

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // CRUD Eventos
  const handleSaveEvent = () => {
    if (!eventModal.event) return;
    const evtData = {
      id: eventModal.event.id || `evt-${Date.now()}`,
      status: eventModal.event.status || AuctionStatus.UPCOMING,
      title: eventModal.event.title || '',
      description: eventModal.event.description || '',
      coverImage: eventModal.event.coverImage || '',
      startTime: eventModal.event.startTime || new Date(),
      endTime: eventModal.event.endTime || new Date(Date.now() + 86400000),
      paymentConfigId: eventModal.event.paymentConfigId || DEFAULT_PAYMENT_CONFIGS[0].id,
    } as AuctionEvent;

    if (eventModal.event.id) {
      onUpdateEvent(evtData);
    } else {
      onCreateEvent(evtData);
    }
    setEventModal({ isOpen: false, event: null });
  };

  // CRUD Lotes
  const handleSaveLot = () => {
    if (!lotModal.lot) return;
    const lotData = {
      id: lotModal.lot.id || `lot-${Date.now()}`,
      auctionId: lotModal.lot.auctionId || events[0]?.id || '',
      lotNumber: Number(lotModal.lot.lotNumber) || 1,
      name: lotModal.lot.name || '',
      breed: lotModal.lot.breed || '',
      dob: lotModal.lot.dob || '',
      gender: lotModal.lot.gender || 'Stallion',
      sire: lotModal.lot.sire || '',
      dam: lotModal.lot.dam || '',
      damSire: lotModal.lot.damSire || '',
      discipline: lotModal.lot.discipline || '',
      height: lotModal.lot.height || '',
      description: lotModal.lot.description || '',
      imageUrl: lotModal.lot.imageUrl || '',
      startPrice: Number(lotModal.lot.startPrice) || 0,
      currentPrice: Number(lotModal.lot.currentPrice) || Number(lotModal.lot.startPrice) || 0,
      incrementAmount: Number(lotModal.lot.incrementAmount) || 500,
      installments: Number(lotModal.lot.installments) || 30,
      status: lotModal.lot.status || AuctionStatus.UPCOMING,
      endTime: lotModal.lot.endTime || new Date(Date.now() + 3600000),
      bids: lotModal.lot.bids || [],
    } as HorseLot;

    if (lotModal.lot.id) {
      onUpdateLot(lotData);
    } else {
      onCreateLot(lotData);
    }
    setLotModal({ isOpen: false, lot: null });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sidebar Nav */}
      <div className="fixed w-64 h-full bg-equus-navy text-white flex flex-col p-6 z-40">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 border-2 border-equus-gold rounded flex items-center justify-center font-serif text-xl text-equus-gold">H</div>
          <div>
            <h1 className="font-serif font-bold text-lg leading-none">ADMIN</h1>
            <p className="text-[10px] text-equus-gold uppercase tracking-widest font-bold">Auction Control</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('SUBMISSIONS')}
            className={`flex items-center gap-3 p-4 rounded-sm text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'SUBMISSIONS' ? 'bg-equus-gold text-equus-navy' : 'hover:bg-white/5 text-gray-400'}`}
          >
            Submissões <span className="ml-auto bg-black/20 px-2 rounded-full">{submissions.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('EVENTS')}
            className={`flex items-center gap-3 p-4 rounded-sm text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'EVENTS' ? 'bg-equus-gold text-equus-navy' : 'hover:bg-white/5 text-gray-400'}`}
          >
            Eventos
          </button>
          <button 
            onClick={() => setActiveTab('LOTS')}
            className={`flex items-center gap-3 p-4 rounded-sm text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'LOTS' ? 'bg-equus-gold text-equus-navy' : 'hover:bg-white/5 text-gray-400'}`}
          >
            Lotes
          </button>
          <button 
            onClick={() => setActiveTab('USERS')}
            className={`flex items-center gap-3 p-4 rounded-sm text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'USERS' ? 'bg-equus-gold text-equus-navy' : 'hover:bg-white/5 text-gray-400'}`}
          >
            Usuários
          </button>
        </nav>

        <button onClick={onNavigateHome} className="mt-auto p-4 text-xs font-bold uppercase text-gray-500 hover:text-red-400 flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/></svg>
           Retornar ao Site
        </button>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-12">
        
        {/* TAB: SUBMISSÕES */}
        {activeTab === 'SUBMISSIONS' && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-3xl font-serif font-bold text-equus-navy uppercase tracking-tighter italic">Submissões de Vendedores</h2>
            <div className="grid grid-cols-1 gap-4">
              {submissions.map(sub => (
                <div key={sub.id} className="bg-white p-6 rounded border border-gray-200 shadow-sm flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img src={sub.galleryPhotos[0]} className="w-full h-full object-cover" alt={sub.name} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-equus-navy">{sub.name}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{sub.breed} • {sub.gender}</p>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span><strong>Vendedor:</strong> {sub.sellerName}</span>
                      <span><strong>Valor Alvo:</strong> {formatCurrency(sub.targetPrice)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setApprovalModal({ isOpen: true, subId: sub.id })}
                      className="bg-emerald-600 text-white px-6 py-3 rounded-sm font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-colors"
                    >
                      Aprovar Lote
                    </button>
                    <button 
                      onClick={() => onRejectSubmission(sub.id)}
                      className="bg-red-50 text-red-600 px-6 py-3 rounded-sm font-bold uppercase text-[10px] tracking-widest hover:bg-red-100 transition-colors"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && <p className="text-gray-400 italic">Nenhuma submissão pendente.</p>}
            </div>
          </div>
        )}

        {/* TAB: EVENTOS */}
        {activeTab === 'EVENTS' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-serif font-bold text-equus-navy uppercase tracking-tighter italic">Calendário de Eventos</h2>
              <button 
                onClick={() => setEventModal({ isOpen: true, event: {} })}
                className="bg-equus-navy text-white px-8 py-4 rounded-sm font-bold uppercase text-xs tracking-widest shadow-xl hover:bg-equus-gold transition-all"
              >
                + Novo Evento
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(evt => (
                <div key={evt.id} className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm group">
                  <div className="h-40 relative">
                    <img src={evt.coverImage} className="w-full h-full object-cover opacity-80" alt={evt.title} />
                    <div className="absolute inset-0 bg-equus-navy/40 group-hover:bg-equus-navy/20 transition-all"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-lg text-equus-navy mb-2">{evt.title}</h3>
                    <div className="space-y-1 text-xs text-gray-500 mb-6">
                      <p><strong>Abertura:</strong> {new Date(evt.startTime).toLocaleString()}</p>
                      <p><strong>Encerramento:</strong> {new Date(evt.endTime).toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => setEventModal({ isOpen: true, event: evt })}
                      className="w-full p-3 border border-equus-navy text-equus-navy font-bold uppercase text-[10px] tracking-widest hover:bg-equus-navy hover:text-white transition-all"
                    >
                      Editar Configurações
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: LOTES */}
        {activeTab === 'LOTS' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-serif font-bold text-equus-navy uppercase tracking-tighter italic">Catálogo de Lotes</h2>
              <button 
                onClick={() => setLotModal({ isOpen: true, lot: {} })}
                className="bg-equus-navy text-white px-8 py-4 rounded-sm font-bold uppercase text-xs tracking-widest shadow-xl hover:bg-equus-gold transition-all"
              >
                + Adicionar Lote Manual
              </button>
            </div>
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">Lote</th>
                    <th className="p-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">Animal</th>
                    <th className="p-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">Preço Atual</th>
                    <th className="p-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">Encerramento</th>
                    <th className="p-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lots.map(lot => (
                    <tr key={lot.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-equus-gold">#{lot.lotNumber}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={lot.imageUrl} className="w-10 h-10 rounded-full object-cover" />
                          <span className="font-bold text-equus-navy">{lot.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-600">{formatCurrency(lot.currentPrice)}</td>
                      <td className="p-4 text-xs text-gray-500">{new Date(lot.endTime).toLocaleString()}</td>
                      <td className="p-4">
                        <button 
                          onClick={() => setLotModal({ isOpen: true, lot: lot })}
                          className="text-equus-navy font-bold uppercase text-[10px] tracking-widest hover:text-equus-gold"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: USUÁRIOS */}
        {activeTab === 'USERS' && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-3xl font-serif font-bold text-equus-navy uppercase tracking-tighter italic">Gestão de Compradores</h2>
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">Nome / Documento</th>
                    <th className="p-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">Email / Fone</th>
                    <th className="p-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">Status</th>
                    <th className="p-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-equus-navy">{user.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{user.cpf}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{user.email}</p>
                        <p className="text-xs text-gray-400 font-mono">{user.phone}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                          user.status === UserStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                          user.status === UserStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => onUpdateUserStatus(user.id, UserStatus.APPROVED)}
                            className="text-emerald-600 font-bold uppercase text-[9px] tracking-widest hover:underline"
                          >
                            Aprovar
                          </button>
                          <button 
                            onClick={() => onUpdateUserStatus(user.id, UserStatus.BLOCKED)}
                            className="text-red-600 font-bold uppercase text-[9px] tracking-widest hover:underline"
                          >
                            Bloquear
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">Nenhum usuário cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODAL EVENTO */}
      {eventModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-10 rounded shadow-2xl max-w-2xl w-full border-t-8 border-equus-gold max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-serif font-bold text-equus-navy mb-8 uppercase italic">{eventModal.event?.id ? 'Editar Evento' : 'Novo Evento'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Título do Evento</label>
                <input 
                  type="text" 
                  value={eventModal.event?.title || ''} 
                  onChange={e => setEventModal({...eventModal, event: {...eventModal.event, title: e.target.value}})}
                  className="w-full p-4 border border-gray-200 rounded focus:border-equus-gold outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Descrição Curta</label>
                <textarea 
                  value={eventModal.event?.description || ''} 
                  onChange={e => setEventModal({...eventModal, event: {...eventModal.event, description: e.target.value}})}
                  className="w-full p-4 border border-gray-200 rounded focus:border-equus-gold outline-none h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Data de Abertura</label>
                <input 
                  type="datetime-local" 
                  value={eventModal.event?.startTime ? new Date(eventModal.event.startTime).toISOString().slice(0,16) : ''} 
                  onChange={e => setEventModal({...eventModal, event: {...eventModal.event, startTime: new Date(e.target.value)}})}
                  className="w-full p-4 border border-gray-200 rounded outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Data de Encerramento</label>
                <input 
                  type="datetime-local" 
                  value={eventModal.event?.endTime ? new Date(eventModal.event.endTime).toISOString().slice(0,16) : ''} 
                  onChange={e => setEventModal({...eventModal, event: {...eventModal.event, endTime: new Date(e.target.value)}})}
                  className="w-full p-4 border border-gray-200 rounded outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Regra de Pagamento</label>
                <select 
                  value={eventModal.event?.paymentConfigId || ''} 
                  onChange={e => setEventModal({...eventModal, event: {...eventModal.event, paymentConfigId: e.target.value}})}
                  className="w-full p-4 border border-gray-200 rounded outline-none"
                >
                  {DEFAULT_PAYMENT_CONFIGS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={() => setEventModal({ isOpen: false, event: null })} className="flex-1 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 hover:text-red-500">Cancelar</button>
              <button onClick={handleSaveEvent} className="flex-1 py-4 bg-equus-navy text-white font-bold uppercase text-[10px] tracking-widest hover:bg-equus-gold transition-all">Salvar Evento</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOTE */}
      {lotModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-10 rounded shadow-2xl max-w-4xl w-full border-t-8 border-equus-gold max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-serif font-bold text-equus-navy mb-8 uppercase italic">{lotModal.lot?.id ? 'Editar Lote' : 'Novo Lote'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Evento</label>
                <select 
                   value={lotModal.lot?.auctionId || ''} 
                   onChange={e => setLotModal({...lotModal, lot: {...lotModal.lot, auctionId: e.target.value}})}
                   className="w-full p-3 border border-gray-200 rounded outline-none"
                >
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Número do Lote</label>
                <input 
                  type="number" 
                  value={lotModal.lot?.lotNumber || ''} 
                  onChange={e => setLotModal({...lotModal, lot: {...lotModal.lot, lotNumber: Number(e.target.value)}})}
                  className="w-full p-3 border border-gray-200 rounded outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome do Animal</label>
                <input 
                  type="text" 
                  value={lotModal.lot?.name || ''} 
                  onChange={e => setLotModal({...lotModal, lot: {...lotModal.lot, name: e.target.value}})}
                  className="w-full p-3 border border-gray-200 rounded outline-none"
                />
              </div>
              
              <div className="md:col-span-3 grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Preço Inicial (Total)</label>
                    <input 
                      type="number" 
                      value={lotModal.lot?.startPrice || ''} 
                      onChange={e => setLotModal({...lotModal, lot: {...lotModal.lot, startPrice: Number(e.target.value)}})}
                      className="w-full p-3 border border-gray-200 rounded outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Incremento Mínimo</label>
                    <input 
                      type="number" 
                      value={lotModal.lot?.incrementAmount || ''} 
                      onChange={e => setLotModal({...lotModal, lot: {...lotModal.lot, incrementAmount: Number(e.target.value)}})}
                      className="w-full p-3 border border-gray-200 rounded outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Parcelas</label>
                    <input 
                      type="number" 
                      value={lotModal.lot?.installments || ''} 
                      onChange={e => setLotModal({...lotModal, lot: {...lotModal.lot, installments: Number(e.target.value)}})}
                      className="w-full p-3 border border-gray-200 rounded outline-none"
                    />
                  </div>
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">URL da Imagem Principal</label>
                <input 
                  type="text" 
                  value={lotModal.lot?.imageUrl || ''} 
                  onChange={e => setLotModal({...lotModal, lot: {...lotModal.lot, imageUrl: e.target.value}})}
                  className="w-full p-3 border border-gray-200 rounded outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Encerramento Individual do Lote</label>
                <input 
                  type="datetime-local" 
                  value={lotModal.lot?.endTime ? new Date(lotModal.lot.endTime).toISOString().slice(0,16) : ''} 
                  onChange={e => setLotModal({...lotModal, lot: {...lotModal.lot, endTime: new Date(e.target.value)}})}
                  className="w-full p-3 border border-gray-200 rounded outline-none"
                />
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={() => setLotModal({ isOpen: false, lot: null })} className="flex-1 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 hover:text-red-500">Cancelar</button>
              <button onClick={handleSaveLot} className="flex-1 py-4 bg-equus-navy text-white font-bold uppercase text-[10px] tracking-widest hover:bg-equus-gold transition-all">Salvar Lote</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APROVAÇÃO SUBMISSÃO */}
      {approvalModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-10 rounded shadow-2xl max-w-lg w-full border-t-8 border-emerald-500">
            <h3 className="text-2xl font-serif font-bold text-equus-navy mb-8 uppercase italic">Configurar Lote para Leilão</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Evento de Destino</label>
                <select 
                  value={approveConfig.eventId} 
                  onChange={e => setApproveConfig({...approveConfig, eventId: e.target.value})}
                  className="w-full p-4 border border-gray-200 rounded outline-none"
                >
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Lote Nº</label>
                  <input 
                    type="number" 
                    value={approveConfig.lotNumber} 
                    onChange={e => setApproveConfig({...approveConfig, lotNumber: Number(e.target.value)})}
                    className="w-full p-4 border border-gray-200 rounded outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Preço Inicial</label>
                  <input 
                    type="number" 
                    value={approveConfig.startPrice} 
                    onChange={e => setApproveConfig({...approveConfig, startPrice: Number(e.target.value)})}
                    className="w-full p-4 border border-gray-200 rounded outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={() => setApprovalModal({ isOpen: false, subId: null })} className="flex-1 py-4 font-bold uppercase text-[10px] tracking-widest text-gray-400 hover:text-red-500">Cancelar</button>
              <button 
                onClick={() => {
                  if(approvalModal.subId) onApproveSubmission(approvalModal.subId, approveConfig);
                  setApprovalModal({ isOpen: false, subId: null });
                }}
                className="flex-1 py-4 bg-emerald-600 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all"
              >
                Confirmar Lote
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
