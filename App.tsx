
import React, { useState, useEffect, useRef } from 'react';
import { AuctionEvent, HorseLot, Bid, AuctionStatus, UserProfile, UserStatus } from './types';
import { MOCK_EVENTS, MOCK_LOTS, DEFAULT_PAYMENT_CONFIGS } from './services/mockData';
import { auth, db, isGCPConfigured, streamActiveEvents, streamLotsByEvent, placeBidGCP } from './services/gcp';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

import AuctionCard from './components/AuctionCard';
import GeminiConsultant from './components/GeminiConsultant';
import Countdown from './components/Countdown';
import SellerRegistration from './components/SellerRegistration';
import AdminDashboard from './components/AdminDashboard';
import UserRegistration from './components/UserRegistration';
import Login from './components/Login';
import ToastNotification, { Toast } from './components/ToastNotification';

const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (date: any) => (date?.toDate ? date.toDate() : new Date(date)).toLocaleDateString('pt-BR');
const formatTime = (date: any) => (date?.toDate ? date.toDate() : new Date(date)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'HOME' | 'EVENT' | 'DETAIL' | 'SELLER' | 'REGISTER' | 'LOGIN' | 'ADMIN'>('HOME');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [bidConfirmation, setBidConfirmation] = useState<{isOpen: boolean, amount: number} | null>(null);
  const [officialTime, setOfficialTime] = useState(new Date());
  
  const [events, setEvents] = useState<AuctionEvent[]>([]);
  const [lots, setLots] = useState<HorseLot[]>([]);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, type: 'USER' | 'ADMIN', status: UserStatus} | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const shownToastsRef = useRef<Set<string>>(new Set());

  const displayEvents = events.length > 0 ? events : MOCK_EVENTS;
  const displayLots = [...lots].sort((a, b) => a.lotNumber - b.lotNumber);
  const activeLot = displayLots.find(l => l.id === selectedLotId);
  const activeEvent = displayEvents.find(e => e.id === selectedEventId);
  const activePaymentConfig = DEFAULT_PAYMENT_CONFIGS.find(p => p.id === activeEvent?.paymentConfigId);

  useEffect(() => {
    const timer = setInterval(() => setOfficialTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isGCPConfigured) {
      setEvents(MOCK_EVENTS);
      setLoading(false);
      return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth!, async (user) => {
      if (user) {
        const docRef = doc(db!, 'profiles', user.uid);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()){
            const data = docSnap.data();
            setCurrentUser({ id: user.uid, name: data.name, type: data.role || 'USER', status: data.status || UserStatus.PENDING });
        } else {
            // Caso especial para admin recém criado ou mock
            setCurrentUser({ id: user.uid, name: user.email || 'Usuário', type: 'USER', status: UserStatus.APPROVED });
        }
      } else {
        // Preservar login de homologação se não houver Firebase conectado
        if (currentUser?.id !== 'admin-dev') {
            setCurrentUser(null);
        }
      }
    });
    const unsubscribeEvents = streamActiveEvents(setEvents);
    return () => { unsubscribeAuth(); unsubscribeEvents(); };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!selectedEventId) return;
    const unsubscribeLots = streamLotsByEvent(selectedEventId, setLots);
    return () => unsubscribeLots();
  }, [selectedEventId]);

  const addToast = (toast: Omit<Toast, 'id'> & { id: string }) => setToasts(prev => [toast, ...prev].slice(0, 4));
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleBid = async () => {
    if (!currentUser) return setCurrentView('LOGIN');
    if (currentUser.status !== UserStatus.APPROVED) {
        alert("Seu cadastro está em análise. Você ainda não pode efetuar lances.");
        return;
    }
    if (!activeLot || !bidConfirmation) return;

    try {
        if (isGCPConfigured) {
            await placeBidGCP(activeLot.id, bidConfirmation.amount, currentUser.id, currentUser.name);
        } else {
            // Mock Bid para teste visual
            const newLots = lots.map(l => l.id === activeLot.id ? { ...l, currentPrice: bidConfirmation.amount } : l);
            setLots(newLots);
        }
        setBidConfirmation(null);
        setNotification({ type: 'success', message: 'LANCE REGISTRADO!' });
        setTimeout(() => setNotification(null), 3000);
    } catch (e: any) {
        alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-equus-navy text-white shadow-xl sticky top-0 z-50 border-b-2 border-equus-gold/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center h-24">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentView('HOME')}>
                <div className="w-12 h-12 border-2 border-equus-gold rounded-sm flex items-center justify-center font-serif font-bold text-equus-gold text-2xl">H</div>
                <div className="flex flex-col">
                  <span className="font-serif font-bold text-xl tracking-[0.2em] leading-none">HORSE BID</span>
                  <span className="text-[10px] uppercase tracking-[0.4em] text-equus-gold font-bold">Market Platform</span>
                </div>
            </div>

            <div className="hidden lg:flex flex-col items-center px-6 border-x border-white/10">
                <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-bold mb-1">Horário Oficial</span>
                <span className="text-xl font-mono font-bold text-equus-gold">{officialTime.toLocaleTimeString('pt-BR')}</span>
            </div>

            <nav className="hidden md:flex items-center gap-10">
                <button onClick={() => setCurrentView('HOME')} className="text-xs font-bold uppercase hover:text-equus-gold tracking-[0.2em] transition-all">Catálogo</button>
                <button onClick={() => setCurrentView('SELLER')} className="text-xs font-bold uppercase hover:text-equus-gold tracking-[0.2em] transition-all">Vender</button>
                {currentUser?.type === 'ADMIN' && (
                    <button onClick={() => setCurrentView('ADMIN')} className="text-xs font-bold uppercase text-equus-gold border-2 border-equus-gold px-4 py-2 hover:bg-equus-gold hover:text-equus-navy transition-all animate-pulse shadow-[0_0_15px_rgba(197,160,89,0.4)]">Admin Panel</button>
                )}
                {currentUser ? (
                    <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                        <span className="text-xs font-bold text-equus-gold">{currentUser.name.toUpperCase()}</span>
                        <button onClick={() => { if(isGCPConfigured) firebaseSignOut(auth!); setCurrentUser(null); setCurrentView('HOME'); }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-all text-[10px] font-bold uppercase">
                             Sair
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-6 items-center">
                        <button onClick={() => setCurrentView('LOGIN')} className="text-xs font-bold uppercase hover:text-equus-gold transition-all">Entrar</button>
                        <button onClick={() => setCurrentView('REGISTER')} className="bg-equus-gold text-equus-navy px-8 py-3 rounded-sm font-bold text-[10px] uppercase shadow-xl tracking-[0.2em] hover:bg-white transition-all">Cadastro</button>
                    </div>
                )}
            </nav>
        </div>
      </header>

      <main className="flex-1">
        {currentView === 'HOME' && (
            <div className="animate-fade-in">
                <section className="relative h-[550px] bg-equus-navy overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1598556776374-1a9b37d7c624?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Banner" />
                    <div className="absolute inset-0 bg-gradient-to-r from-equus-navy to-transparent"></div>
                    <div className="relative z-10 max-w-7xl mx-auto h-full px-4 flex flex-col justify-center">
                        <h1 className="text-5xl md:text-7xl font-serif font-bold text-white italic mb-4 leading-none tracking-tighter">Genética de <span className="text-equus-gold">Classe Mundial</span>.</h1>
                        <p className="text-lg text-gray-300 max-w-lg font-light italic mb-10">Lances automatizados e curadoria técnica para compradores exigentes.</p>
                        <button onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })} className="w-fit bg-equus-gold text-equus-navy px-12 py-5 font-bold uppercase text-[10px] tracking-[0.4em] shadow-2xl hover:bg-white transition-all">Explorar Catálogo</button>
                    </div>
                </section>
                <div className="max-w-7xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-2 gap-12">
                    {displayEvents.map(evt => (
                        <div key={evt.id} className="group bg-white border border-gray-100 shadow-xl overflow-hidden cursor-pointer flex flex-col" onClick={() => { setSelectedEventId(evt.id); setCurrentView('EVENT'); }}>
                            <div className="h-64 overflow-hidden relative">
                                <img src={evt.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt={evt.title} />
                                <div className="absolute top-4 left-4 bg-equus-gold text-equus-navy px-4 py-1.5 rounded-sm font-bold text-[10px] uppercase tracking-widest shadow-xl">
                                    Abertura: {formatDate(evt.startTime)} às {formatTime(evt.startTime)}
                                </div>
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h3 className="text-2xl font-serif font-bold italic">{evt.title}</h3>
                                </div>
                            </div>
                            <div className="p-8">
                                <p className="text-gray-500 text-sm italic mb-4">{evt.description}</p>
                                <button className="w-full py-3 bg-equus-navy text-white text-[10px] font-bold uppercase tracking-widest hover:bg-equus-gold transition-all">Ver Lotes</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {currentView === 'EVENT' && (
            <div className="max-w-7xl mx-auto px-4 py-16 animate-fade-in">
                <header className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-4xl font-serif font-bold text-equus-navy italic">{activeEvent?.title}</h2>
                        <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Catálogo Oficial de Lances</span>
                    </div>
                    <button onClick={() => setCurrentView('HOME')} className="text-[10px] font-bold uppercase text-gray-400 hover:text-equus-navy tracking-widest">Voltar</button>
                </header>
                <div className="mb-12 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white p-6 rounded-sm border border-gray-100 shadow-md flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Início Lote 01</span>
                        <p className="text-equus-navy text-lg font-bold">{formatDate(activeEvent?.startTime)}</p>
                        <p className="text-equus-gold text-xl font-bold font-serif">{formatTime(activeEvent?.startTime)}h</p>
                    </div>
                    <div className="bg-white p-6 rounded-sm border border-gray-100 shadow-md flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pagamento</span>
                        <p className="text-equus-navy text-sm font-bold">{activePaymentConfig?.name || "30 Parcelas"}</p>
                    </div>
                    <div className="bg-white p-6 rounded-sm border border-gray-100 shadow-md flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Incremento</span>
                        <p className="text-equus-navy text-xl font-bold">R$ 500,00</p>
                    </div>
                    <div className="bg-white p-6 rounded-sm border border-gray-100 shadow-md flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Comissão</span>
                        <p className="text-equus-navy text-xl font-bold">8,5%</p>
                    </div>
                    <div className="bg-white p-6 rounded-sm border border-gray-100 shadow-md flex flex-col justify-center">
                         <button className="bg-equus-navy text-white py-2 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-equus-gold">Ver Edital</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 border-t pt-12">
                    {displayLots.map(lot => (
                        <AuctionCard 
                            key={lot.id} 
                            lot={lot} 
                            onClick={(id) => { setSelectedLotId(id); setCurrentView('DETAIL'); }} 
                            eventStartTime={activeEvent?.startTime}
                        />
                    ))}
                </div>
            </div>
        )}

        {currentView === 'DETAIL' && activeLot && (
            <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in">
                <button onClick={() => setCurrentView('EVENT')} className="mb-8 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-equus-navy">← Voltar ao Evento</button>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        <div className="bg-white p-2 rounded shadow-2xl border border-gray-100 relative overflow-hidden">
                            <img src={activeLot.imageUrl} className="w-full h-[600px] object-cover rounded-sm" alt={activeLot.name} />
                            <div className="absolute top-6 left-6 bg-equus-navy/90 text-white px-4 py-2 rounded-sm font-serif font-bold italic shadow-xl">Lote {activeLot.lotNumber}</div>
                        </div>
                        <div className="bg-white p-12 shadow-2xl rounded-sm border border-gray-50 space-y-12">
                            <h2 className="text-5xl font-serif font-bold text-equus-navy italic">{activeLot.name}</h2>
                            <p className="text-xl text-gray-600 font-light italic leading-relaxed">{activeLot.description}</p>
                            <GeminiConsultant horse={activeLot} />
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="bg-white p-8 shadow-2xl border-t-8 border-equus-navy rounded-sm sticky top-32">
                            <div className="bg-equus-navy text-white p-6 text-center rounded-sm mb-8">
                                <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-60 mb-2 block">Fechamento do Lote</span>
                                <Countdown endTime={activeLot.endTime} finishedText={activeLot.status === AuctionStatus.SOLD ? 'Vendido' : 'Encerrado'} />
                            </div>
                            <div className="border-b border-gray-100 pb-6 mb-8">
                                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Valor Atual</span>
                                <div className="text-4xl font-bold text-equus-navy">
                                    {activeLot.installments}x <span className="text-equus-gold">{formatCurrency(activeLot.currentPrice / activeLot.installments)}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setBidConfirmation({ isOpen: true, amount: activeLot.currentPrice + (activeLot.incrementAmount || 500) })}
                                className="w-full py-6 bg-equus-navy text-white font-bold uppercase text-[11px] tracking-[0.4em] shadow-xl hover:bg-equus-gold hover:text-equus-navy transition-all transform active:scale-95"
                            >
                                Efetuar Lance (Min R$ {activeLot.incrementAmount || 500})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {currentView === 'SELLER' && <SellerRegistration onCancel={() => setCurrentView('HOME')} onSubmit={() => setCurrentView('HOME')} />}
        {currentView === 'REGISTER' && <UserRegistration onCancel={() => setCurrentView('HOME')} onSuccess={() => setCurrentView('HOME')} />}
        {currentView === 'LOGIN' && <Login onCancel={() => setCurrentView('HOME')} onSuccess={(u) => { setCurrentUser(u); setCurrentView('HOME'); }} onRegisterClick={() => setCurrentView('REGISTER')} />}
        {currentView === 'ADMIN' && <AdminDashboard events={displayEvents} lots={displayLots} onNavigateHome={() => setCurrentView('HOME')} />}
      </main>

      {bidConfirmation && (
          <div className="fixed inset-0 bg-equus-navy/95 flex items-center justify-center z-[100] backdrop-blur-md p-6">
              <div className="bg-white p-12 max-w-lg w-full text-center border-t-8 border-equus-gold shadow-2xl rounded-sm">
                  <h3 className="text-3xl font-serif font-bold italic mb-6">Confirmar Lance Oficial</h3>
                  <div className="bg-gray-50 p-8 rounded mb-10 border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Valor Total do Arremate</span>
                      <span className="text-4xl font-bold text-equus-navy">{formatCurrency(bidConfirmation.amount)}</span>
                      <p className="text-[10px] mt-4 font-bold text-gray-500 uppercase tracking-widest">{activeLot?.installments}x de {formatCurrency(bidConfirmation.amount / (activeLot?.installments || 1))}</p>
                  </div>
                  <div className="flex flex-col gap-4">
                      <button onClick={handleBid} className="bg-equus-navy text-white py-6 rounded-sm font-bold uppercase text-[11px] tracking-[0.4em] shadow-xl hover:bg-black transition-all">Assinar Lance Digitalmente</button>
                      <button onClick={() => setBidConfirmation(null)} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-500">Cancelar Operação</button>
                  </div>
              </div>
          </div>
      )}

      {notification && (
          <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] px-12 py-5 rounded shadow-2xl border-l-4 ${notification.type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'} text-white animate-fade-in`}>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{notification.message}</span>
          </div>
      )}
    </div>
  );
};

export default App;
