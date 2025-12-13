
import React, { useState } from 'react';
import { AuctionEvent, SellerSubmission, PaymentConfig, AuctionStatus } from '../types';
import { DEFAULT_PAYMENT_CONFIGS } from '../services/mockData';

interface Props {
  events: AuctionEvent[];
  submissions: SellerSubmission[];
  onCreateEvent: (evt: AuctionEvent) => void;
  onApproveSubmission: (subId: string, config: { eventId: string; startPrice: number; increment: number; lotNumber: number }) => void;
  onRejectSubmission: (subId: string) => void;
  onNavigateHome: () => void;
}

const AdminDashboard: React.FC<Props> = ({ events, submissions, onCreateEvent, onApproveSubmission, onRejectSubmission, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'SUBMISSIONS'>('SUBMISSIONS');
  
  // Create Event State
  const [newEvent, setNewEvent] = useState<Partial<AuctionEvent>>({ title: '', description: '', coverImage: '', paymentConfigId: DEFAULT_PAYMENT_CONFIGS[0].id });
  
  // Approval Modal State
  const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; subId: string | null }>({ isOpen: false, subId: null });
  const [approveConfig, setApproveConfig] = useState({ eventId: events[0]?.id || '', startPrice: 0, increment: 500, lotNumber: 1 });

  // Details View Modal State
  const [viewModal, setViewModal] = useState<{ isOpen: boolean; sub: SellerSubmission | null }>({ isOpen: false, sub: null });

  const formatCurrency = (val: number) => {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleCreateEvent = () => {
      const evt: AuctionEvent = {
          id: `evt-${Date.now()}`,
          startTime: new Date(),
          endTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
          status: AuctionStatus.UPCOMING,
          ...newEvent as AuctionEvent
      };
      onCreateEvent(evt);
      alert("Evento criado com sucesso!");
      setNewEvent({ title: '', description: '', coverImage: '' });
  };

  const openApproval = (subId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setApprovalModal({ isOpen: true, subId });
  };

  const handleReject = (subId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm("Tem certeza que deseja rejeitar este cadastro?")) {
          onRejectSubmission(subId);
      }
  };

  const confirmApproval = () => {
      if (approvalModal.subId) {
          onApproveSubmission(approvalModal.subId, approveConfig);
          setApprovalModal({ isOpen: false, subId: null });
      }
  };

  const openDetails = (sub: SellerSubmission) => {
      setViewModal({ isOpen: true, sub });
  };

  return (
    <div className="min-h-screen bg-gray-100">
        <div className="bg-equus-navy text-white p-4 shadow-md flex justify-between items-center">
            <h1 className="font-serif font-bold text-xl tracking-widest">PAINEL ADMINISTRATIVO</h1>
            <button onClick={onNavigateHome} className="text-xs uppercase hover:text-equus-gold">Sair</button>
        </div>

        <div className="max-w-7xl mx-auto py-8 px-4">
            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-300">
                <button 
                    onClick={() => setActiveTab('SUBMISSIONS')}
                    className={`pb-4 px-2 font-bold uppercase text-sm tracking-wider ${activeTab === 'SUBMISSIONS' ? 'border-b-4 border-equus-gold text-equus-navy' : 'text-gray-400'}`}
                >
                    Aprovação de Lotes ({submissions.filter(s => s.status === 'PENDING').length})
                </button>
                <button 
                    onClick={() => setActiveTab('EVENTS')}
                    className={`pb-4 px-2 font-bold uppercase text-sm tracking-wider ${activeTab === 'EVENTS' ? 'border-b-4 border-equus-gold text-equus-navy' : 'text-gray-400'}`}
                >
                    Gestão de Eventos
                </button>
            </div>

            {/* SUBMISSIONS TAB */}
            {activeTab === 'SUBMISSIONS' && (
                <div className="grid grid-cols-1 gap-6">
                    {submissions.length === 0 && <p className="text-gray-500">Nenhum cadastro pendente.</p>}
                    
                    {submissions.filter(s => s.status === 'PENDING').map(sub => (
                        <div key={sub.id} className="bg-white p-6 rounded shadow-sm flex flex-col md:flex-row gap-6 border-l-4 border-yellow-400">
                            <div className="w-32 h-32 bg-gray-200 flex-shrink-0">
                                <img src={sub.photos.left} className="w-full h-full object-cover rounded" alt="Preview" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-2">
                                    <h3 className="text-xl font-bold text-equus-navy">{sub.name}</h3>
                                    <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded">PENDENTE</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1"><strong>Vendedor:</strong> {sub.sellerName} ({sub.sellerEmail})</p>
                                <p className="text-sm text-gray-600 mb-4"><strong>Raça:</strong> {sub.breed} • <strong>Nascimento:</strong> {sub.dob}</p>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => openDetails(sub)}
                                        className="bg-blue-600 text-white px-4 py-2 text-sm font-bold uppercase rounded hover:bg-blue-500"
                                    >
                                        Visualizar
                                    </button>
                                    <button 
                                        onClick={(e) => openApproval(sub.id, e)}
                                        className="bg-green-600 text-white px-4 py-2 text-sm font-bold uppercase rounded hover:bg-green-500"
                                    >
                                        Aprovar
                                    </button>
                                    <button 
                                        onClick={(e) => handleReject(sub.id, e)}
                                        className="bg-red-100 text-red-600 px-4 py-2 text-sm font-bold uppercase rounded hover:bg-red-200"
                                    >
                                        Rejeitar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Rejected/Approved History could go here */}
                </div>
            )}

            {/* EVENTS TAB */}
            {activeTab === 'EVENTS' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* List */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-equus-navy uppercase mb-4">Eventos Ativos</h3>
                        {events.map(evt => (
                            <div key={evt.id} className="bg-white p-4 rounded shadow-sm border border-gray-200">
                                <h4 className="font-bold text-lg">{evt.title}</h4>
                                <p className="text-sm text-gray-500">{evt.startTime.toLocaleDateString()} - {evt.endTime.toLocaleDateString()}</p>
                                <div className="mt-2 text-xs bg-gray-100 inline-block px-2 py-1 rounded">
                                    Config. Pagamento: {DEFAULT_PAYMENT_CONFIGS.find(p => p.id === evt.paymentConfigId)?.name || 'Padrão'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Create Form */}
                    <div className="bg-white p-6 rounded shadow-lg h-fit">
                        <h3 className="font-bold text-equus-navy uppercase mb-4 border-b border-gray-100 pb-2">Novo Evento</h3>
                        <div className="space-y-4">
                            <input 
                                placeholder="Título do Evento" 
                                value={newEvent.title} 
                                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded"
                            />
                            <textarea 
                                placeholder="Descrição" 
                                value={newEvent.description} 
                                onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded"
                            />
                            <input 
                                placeholder="URL da Capa" 
                                value={newEvent.coverImage} 
                                onChange={e => setNewEvent({...newEvent, coverImage: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded"
                            />
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Condição de Pagamento</label>
                                <select 
                                    className="w-full p-3 border border-gray-300 rounded"
                                    value={newEvent.paymentConfigId}
                                    onChange={e => setNewEvent({...newEvent, paymentConfigId: e.target.value})}
                                >
                                    {DEFAULT_PAYMENT_CONFIGS.map(conf => (
                                        <option key={conf.id} value={conf.id}>{conf.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={handleCreateEvent} className="w-full bg-equus-navy text-white py-3 font-bold uppercase hover:bg-equus-gold">
                                Criar Evento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* DETAILS VIEW MODAL */}
        {viewModal.isOpen && viewModal.sub && (
             <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[20000] p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="bg-equus-navy text-white p-4 flex justify-between items-center sticky top-0">
                        <h3 className="font-bold uppercase tracking-widest">Detalhes: {viewModal.sub.name}</h3>
                        <button onClick={() => setViewModal({isOpen: false, sub: null})} className="text-2xl">&times;</button>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Images */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                             {Object.entries(viewModal.sub.photos).map(([key, url]) => (
                                 <div key={key} className="aspect-video bg-gray-100">
                                     <img src={url} className="w-full h-full object-cover" alt={key} />
                                     <span className="text-[10px] uppercase text-gray-500 block text-center">{key}</span>
                                 </div>
                             ))}
                        </div>
                        
                        {/* Info */}
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                             <p><strong>ABCCH:</strong> {viewModal.sub.abcchId}</p>
                             <p><strong>Raça:</strong> {viewModal.sub.breed}</p>
                             <p><strong>Pai:</strong> {viewModal.sub.sire}</p>
                             <p><strong>Mãe:</strong> {viewModal.sub.dam}</p>
                             <p><strong>Vídeo:</strong> {viewModal.sub.youtubeLink}</p>
                             <p className="col-span-2 border-t border-gray-200 pt-2 mt-2">
                                <strong className="text-equus-navy">Valor Objetivo:</strong> {formatCurrency(viewModal.sub.targetPrice || 0)}
                             </p>
                        </div>
                        
                        <div>
                            <strong>Descrição:</strong>
                            <p className="text-gray-700">{viewModal.sub.description}</p>
                        </div>
                        
                        <div>
                             <strong>Documentos:</strong>
                             <ul className="list-disc pl-5">
                                 {viewModal.sub.documents.length === 0 ? <li>Nenhum documento.</li> : 
                                     viewModal.sub.documents.map((d, i) => <li key={i}>{d.title}</li>)
                                 }
                             </ul>
                        </div>
                    </div>
                    <div className="p-4 border-t bg-gray-50 text-right">
                        <button onClick={() => setViewModal({isOpen: false, sub: null})} className="px-6 py-2 bg-gray-300 font-bold rounded hover:bg-gray-400">Fechar</button>
                    </div>
                </div>
             </div>
        )}

        {/* APPROVAL MODAL */}
        {approvalModal.isOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[20000]">
                <div className="bg-white p-8 rounded-lg shadow-2xl max-w-lg w-full">
                    <h3 className="text-xl font-bold text-equus-navy mb-6">Configurar Lote</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Evento de Destino</label>
                            <select 
                                className="w-full p-2 border border-gray-300 rounded"
                                value={approveConfig.eventId}
                                onChange={e => setApproveConfig({...approveConfig, eventId: e.target.value})}
                            >
                                {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">Lote Nº</label>
                                <input 
                                    type="number" 
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={approveConfig.lotNumber}
                                    onChange={e => setApproveConfig({...approveConfig, lotNumber: parseInt(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">Preço Inicial (R$)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={approveConfig.startPrice}
                                    onChange={e => setApproveConfig({...approveConfig, startPrice: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Incremento Mínimo (R$)</label>
                            <input 
                                type="number" 
                                className="w-full p-2 border border-gray-300 rounded"
                                value={approveConfig.increment}
                                onChange={e => setApproveConfig({...approveConfig, increment: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button onClick={() => setApprovalModal({isOpen: false, subId: null})} className="flex-1 py-3 border border-gray-300 font-bold uppercase text-xs">Cancelar</button>
                        <button onClick={confirmApproval} className="flex-1 py-3 bg-equus-gold text-white font-bold uppercase text-xs hover:bg-equus-navy">Confirmar Aprovação</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminDashboard;