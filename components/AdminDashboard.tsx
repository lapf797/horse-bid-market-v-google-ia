
import React, { useState } from 'react';
import { AuctionEvent, HorseLot, UserProfile, UserStatus, AuctionStatus, PaymentConfig } from '../types';
import { DEFAULT_PAYMENT_CONFIGS } from '../services/mockData';

interface Props {
  events: AuctionEvent[];
  lots: HorseLot[];
  users: UserProfile[];
  onCreateEvent: (evt: AuctionEvent) => void;
  onUpdateLot: (lot: HorseLot) => void;
  onUpdateUserStatus: (userId: string, status: UserStatus) => void;
  onNavigateHome: () => void;
}

const AdminDashboard: React.FC<Props> = ({ events, lots, users, onCreateEvent, onUpdateLot, onUpdateUserStatus, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'LOTS' | 'USERS'>('EVENTS');
  const [lotModal, setLotModal] = useState<{isOpen: boolean, lot: Partial<HorseLot> | null}>({ isOpen: false, lot: null });
  const [eventModal, setEventModal] = useState<{isOpen: boolean, event: Partial<AuctionEvent> | null}>({ isOpen: false, event: null });

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-equus-navy text-white p-6 flex flex-col shadow-2xl">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-equus-gold flex items-center justify-center font-serif text-equus-gold text-xl font-bold">A</div>
          <div>
            <h1 className="font-serif font-bold text-sm leading-none">GESTOR</h1>
            <p className="text-[10px] text-equus-gold font-bold uppercase tracking-widest">Painel Operacional</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('EVENTS')}
            className={`text-left p-4 rounded text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'EVENTS' ? 'bg-equus-gold text-equus-navy' : 'hover:bg-white/5'}`}
          >
            Leilões & Horários
          </button>
          <button 
            onClick={() => setActiveTab('LOTS')}
            className={`text-left p-4 rounded text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'LOTS' ? 'bg-equus-gold text-equus-navy' : 'hover:bg-white/5'}`}
          >
            Catálogo de Lotes
          </button>
          <button 
            onClick={() => setActiveTab('USERS')}
            className={`text-left p-4 rounded text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'USERS' ? 'bg-equus-gold text-equus-navy' : 'hover:bg-white/5'}`}
          >
            Clientes (Compradores)
          </button>
        </nav>

        <button onClick={onNavigateHome} className="mt-auto flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/></svg>
          Sair do Painel
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-12 overflow-y-auto">
        
        {activeTab === 'EVENTS' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-serif font-bold text-equus-navy italic">Eventos Cadastrados</h2>
              <button onClick={() => setEventModal({isOpen: true, event: {}})} className="bg-equus-navy text-white px-6 py-3 rounded font-bold uppercase text-xs tracking-widest shadow-xl">+ Novo Leilão</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(evt => (
                <div key={evt.id} className="bg-white p-6 rounded border border-gray-200 shadow-sm group">
                  <div className="h-32 mb-4 overflow-hidden rounded"><img src={evt.coverImage} className="w-full h-full object-cover"/></div>
                  <h3 className="font-bold text-lg mb-2">{evt.title}</h3>
                  <div className="space-y-1 text-xs text-gray-500 mb-6">
                    <p><strong>Abertura:</strong> {new Date(evt.startTime).toLocaleString()}</p>
                    <p><strong>Fechamento:</strong> {new Date(evt.endTime).toLocaleString()}</p>
                    <p><strong>Plano:</strong> {DEFAULT_PAYMENT_CONFIGS.find(p => p.id === evt.paymentConfigId)?.name || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-gray-100 p-2 rounded text-[10px] font-bold uppercase hover:bg-gray-200">Editar</button>
                    <button className="flex-1 bg-red-50 text-red-600 p-2 rounded text-[10px] font-bold uppercase hover:bg-red-100">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'LOTS' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-serif font-bold text-equus-navy italic">Catálogo de Lotes</h2>
              <button onClick={() => setLotModal({isOpen: true, lot: {}})} className="bg-equus-navy text-white px-6 py-3 rounded font-bold uppercase text-xs tracking-widest">+ Adicionar Lote</button>
            </div>
            
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                    <th className="p-4">Nº</th>
                    <th className="p-4">Animal</th>
                    <th className="p-4">Evento</th>
                    <th className="p-4">Preço Atual</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {lots.map(lot => (
                    <tr key={lot.id} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-equus-gold">#{lot.lotNumber}</td>
                      <td className="p-4 font-bold">{lot.name}</td>
                      <td className="p-4 text-xs">{events.find(e => e.id === lot.auctionId)?.title}</td>
                      <td className="p-4 font-mono">{formatCurrency(lot.currentPrice)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
                          lot.status === AuctionStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' :
                          lot.status === AuctionStatus.SOLD ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {lot.status}
                        </span>
                      </td>
                      <td className="p-4"><button className="text-blue-600 hover:underline font-bold uppercase text-[10px]">Editar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-3xl font-serif font-bold text-equus-navy italic">Aprovação de Clientes</h2>
            <div className="grid grid-cols-1 gap-4">
              {users.map(user => (
                <div key={user.id} className="bg-white p-6 rounded border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{user.name}</h3>
                    <p className="text-xs text-gray-500">{user.email} • CPF: {user.cpf}</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      user.status === UserStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                      user.status === UserStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => onUpdateUserStatus(user.id, UserStatus.APPROVED)} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.42-6.446a.542.542 0 0 1 .012-.01z"/></svg></button>
                      <button onClick={() => onUpdateUserStatus(user.id, UserStatus.BLOCKED)} className="bg-red-600 text-white p-2 rounded hover:bg-red-700"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/></svg></button>
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="text-center py-12 text-gray-400 italic">Nenhum cliente cadastrado.</p>}
            </div>
          </div>
        )}

      </main>

      {/* Modals placeholders */}
      {lotModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white p-10 rounded shadow-2xl max-w-2xl w-full border-t-8 border-equus-gold">
            <h3 className="text-xl font-serif font-bold mb-8">Cadastrar Novo Lote</h3>
            <p className="text-sm text-gray-500 mb-8 italic">Integração com formulário completo de dados técnicos.</p>
            <button onClick={() => setLotModal({isOpen: false, lot: null})} className="w-full bg-equus-navy text-white py-4 rounded font-bold uppercase tracking-widest">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
