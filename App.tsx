
import React, { useState, useEffect } from 'react';
import { AuctionEvent, HorseLot, SellerSubmission, Bid, AuctionStatus } from './types';
import { MOCK_EVENTS, MOCK_LOTS } from './services/mockData';
import { auth, db, isGCPConfigured, streamActiveEvents, streamLotsByEvent, placeBidGCP } from './services/gcp';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

import AuctionCard from './components/AuctionCard';
import GeminiConsultant from './components/GeminiConsultant';
import Countdown from './components/Countdown';
import SellerRegistration from './components/SellerRegistration';
import AdminDashboard from './components/AdminDashboard';
import UserRegistration from './components/UserRegistration';
import Login from './components/Login';

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
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, type: 'USER' | 'ADMIN'} | null>(null);
  const [loading, setLoading] = useState(true);

  const activeLot = lots.find(l => l.id === selectedLotId);
  const activeEvent = events.find(e => e.id === selectedEventId);

  // 1. Inicialização e Monitoramento de Auth (Google Cloud)
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
        setCurrentUser({
          id: user.uid,
          name: docSnap.exists() ? docSnap.data().name : user.email,
          type: docSnap.exists() && docSnap.data().role === 'ADMIN' ? 'ADMIN' : 'USER'
        });
      } else {
        setCurrentUser(null);
      }
    });

    // Sincronização de Eventos em Tempo Real (Firestore)
    const unsubscribeEvents = streamActiveEvents((data) => {
      setEvents(data.length > 0 ? data : (isGCPConfigured ? [] : MOCK_EVENTS));
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeEvents();
    };
  }, []);

  // 2. Sincronização de Lotes em Tempo Real (Firestore)
  useEffect(() => {
    if (!isGCPConfigured || !selectedEventId) {
      if (!isGCPConfigured && selectedEventId) {
        setLots(MOCK_LOTS.filter(l => l.auctionId === selectedEventId));
      }
      return;
    }

    const unsubscribeLots = streamLotsByEvent(selectedEventId, (data) => {
      setLots(data.map(l => ({
        ...l,
        endTime: l.endTime?.toDate ? l.endTime.toDate() : new Date(l.endTime),
        bids: [] // Lances seriam carregados em sub-coleção se necessário
      })));
    });

    return () => unsubscribeLots();
  }, [selectedEventId]);

  useEffect(() => {
    const timer = setInterval(() => setOfficialTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBid = async () => {
    if (!activeLot || !bidConfirmation || !currentUser) return;
    try {
      await placeBidGCP(activeLot.id, bidConfirmation.amount, currentUser.id, currentUser.name);
      setBidConfirmation(null);
      alert("Lance confirmado com sucesso no Google Cloud!");
    } catch (e: any) {
      alert("Erro: " + e.message);
    }
  };

  const renderHeader = () => (
    <header className="bg-equus-navy text-white shadow-md sticky top-0 z-50 border-b border-equus-gold/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center h-20">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('HOME')}>
                <div className="w-10 h-10 border-2 border-equus-gold rounded-sm flex items-center justify-center font-serif font-bold text-equus-gold text-xl">H</div>
                <div className="flex flex-col">
                  <span className="font-serif font-bold text-lg tracking-widest leading-none">HORSE BID</span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Market</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${isGCPConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isGCPConfigured ? 'text-emerald-400' : 'text-orange-400'}`}>
                            {isGCPConfigured ? 'GOOGLE CLOUD PRODUCTION' : 'MODO DEMONSTRAÇÃO'}
                        </span>
                    </div>
                    <div className="text-xl font-mono font-bold text-equus-gold">
                        {officialTime.toLocaleTimeString('pt-BR', { hour12: false })}
                    </div>
                </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
                <button onClick={() => setCurrentView('HOME')} className="text-xs font-bold uppercase hover:text-equus-gold">Leilões</button>
                <button onClick={() => setCurrentView('SELLER')} className="text-xs font-bold uppercase hover:text-equus-gold">Vender</button>
                {currentUser?.type === 'ADMIN' && (
                    <button onClick={() => setCurrentView('ADMIN')} className="text-xs font-bold uppercase text-equus-gold border border-equus-gold px-2 py-1 rounded">Admin</button>
                )}
                {currentUser ? (
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-300"><strong>{currentUser.name}</strong></span>
                        <button onClick={() => firebaseSignOut(auth!)} className="text-[10px] uppercase font-bold text-red-400">Sair</button>
                    </div>
                ) : (
                    <div className="flex gap-4">
                      <button onClick={() => setCurrentView('LOGIN')} className="font-bold text-xs uppercase">Entrar</button>
                      <button onClick={() => setCurrentView('REGISTER')} className="bg-equus-gold text-equus-navy px-5 py-2 rounded font-bold text-xs uppercase">Cadastro</button>
                    </div>
                )}
            </nav>
        </div>
    </header>
  );

  if (loading) return <div className="h-screen bg-equus-navy flex items-center justify-center text-equus-gold font-serif animate-pulse">Sincronizando com Google Cloud...</div>;

  // Renderização de Home, Evento e Detalhe seguem lógica similar ao App anterior, 
  // mas usando os dados vindos do Firestore.
  // ... (Logica de renderização simplificada para brevidade, mantendo a estética premium)

  if (currentView === 'LOGIN') return <Login onCancel={() => setCurrentView('HOME')} onSuccess={() => setCurrentView('HOME')} onRegisterClick={() => setCurrentView('REGISTER')} />;
  if (currentView === 'REGISTER') return <UserRegistration onCancel={() => setCurrentView('HOME')} onSuccess={() => setCurrentView('LOGIN')} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      {currentView === 'HOME' && (
        <>
          <div className="bg-equus-navy text-white py-24 relative overflow-hidden border-b-8 border-equus-gold">
            <div className="absolute inset-0 opacity-40"><img src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2069" className="w-full h-full object-cover" /></div>
            <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                <span className="text-equus-gold font-bold tracking-[0.4em] uppercase text-xs mb-4 block">Powered by Google Cloud Platform</span>
                <h1 className="text-5xl md:text-8xl font-serif font-bold mb-8 drop-shadow-2xl italic">Horse Bid Live</h1>
                <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-12 font-light">Leilões automatizados com tecnologia de sincronização Firestore de baixa latência.</p>
                <div className="flex justify-center gap-6">
                    <button className="bg-equus-gold text-equus-navy px-12 py-5 rounded-sm font-bold uppercase tracking-widest shadow-xl">Ver Lotes</button>
                </div>
            </div>
          </div>
          <main className="max-w-7xl mx-auto px-4 py-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {events.map(evt => (
                      <div key={evt.id} className="bg-white rounded shadow-2xl overflow-hidden group cursor-pointer border hover:border-equus-gold transition-all" onClick={() => { setSelectedEventId(evt.id); setCurrentView('EVENT'); }}>
                          <img src={evt.coverImage} className="h-80 w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="p-8">
                              <h3 className="text-3xl font-serif font-bold text-equus-navy">{evt.title}</h3>
                              <p className="text-gray-500 mt-2 italic">{evt.description}</p>
                              <div className="mt-6 flex justify-between items-center text-sm font-bold">
                                  <span className="text-equus-gold">Acesse o Catálogo</span>
                                  <span className="font-mono">{formatDate(evt.startTime)}</span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </main>
        </>
      )}

      {currentView === 'EVENT' && activeEvent && (
          <div className="p-8 max-w-7xl mx-auto">
              <button onClick={() => setCurrentView('HOME')} className="mb-8 text-xs font-bold uppercase text-gray-400">← Voltar</button>
              <h2 className="text-4xl font-serif font-bold mb-12 border-b-2 border-equus-gold pb-4">{activeEvent.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {lots.map(lot => (
                      <AuctionCard key={lot.id} lot={lot} onClick={(id) => { setSelectedLotId(id); setCurrentView('DETAIL'); }} />
                  ))}
              </div>
          </div>
      )}

      {currentView === 'DETAIL' && activeLot && (
        <div className="max-w-7xl mx-auto p-8 flex flex-col lg:flex-row gap-12">
            <div className="lg:w-2/3 space-y-8">
                <img src={activeLot.imageUrl} className="w-full h-[500px] object-cover rounded shadow-2xl border-4 border-white" />
                <div className="bg-white p-8 rounded shadow-sm border">
                    <h2 className="text-4xl font-serif font-bold text-equus-navy mb-4">{activeLot.name}</h2>
                    <p className="text-gray-600 leading-relaxed text-lg">{activeLot.description}</p>
                </div>
                <GeminiConsultant horse={activeLot} />
            </div>
            <div className="lg:w-1/3">
                <div className="bg-white p-8 rounded shadow-2xl border-t-8 border-equus-gold sticky top-24">
                    <div className="mb-8 text-center bg-equus-navy text-white p-4 rounded">
                        <Countdown endTime={activeLot.endTime} />
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-between border-b pb-4">
                            <span className="text-xs uppercase font-bold text-gray-400">Lance Atual</span>
                            <span className="text-3xl font-bold text-equus-navy">{activeLot.installments}x {formatCurrency(activeLot.currentPrice / activeLot.installments)}</span>
                        </div>
                        <button 
                            onClick={() => setBidConfirmation({ isOpen: true, amount: activeLot.currentPrice + 500 })}
                            className="w-full bg-equus-gold text-white py-5 rounded font-bold uppercase tracking-widest hover:bg-equus-navy transition-all shadow-lg"
                        >
                            Dar Lance Real
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {bidConfirmation && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
              <div className="bg-white p-12 rounded shadow-2xl max-w-md w-full text-center">
                  <h3 className="text-2xl font-serif font-bold mb-6">Confirmar no Google Cloud?</h3>
                  <p className="mb-8 text-gray-600">Ao confirmar, seu lance será registrado instantaneamente no banco de dados Firestore.</p>
                  <button onClick={handleBid} className="w-full bg-emerald-600 text-white py-4 rounded font-bold uppercase mb-4">Confirmar Agora</button>
                  <button onClick={() => setBidConfirmation(null)} className="text-xs font-bold text-gray-400 uppercase underline">Cancelar</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
