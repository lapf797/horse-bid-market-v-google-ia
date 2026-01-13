
import React, { useState, useEffect } from 'react';
import { AuctionEvent, HorseLot, SellerSubmission, Bid, AuctionStatus, UserProfile, UserStatus } from './types';
import { MOCK_EVENTS, MOCK_LOTS } from './services/mockData';
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

const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (date: any) => (date?.toDate ? date.toDate() : new Date(date)).toLocaleDateString('pt-BR');
const formatTime = (date: any) => (date?.toDate ? date.toDate() : new Date(date)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'HOME' | 'EVENT' | 'DETAIL' | 'SELLER' | 'REGISTER' | 'LOGIN' | 'ADMIN'>('HOME');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [bidConfirmation, setBidConfirmation] = useState<{isOpen: boolean, amount: number} | null>(null);
  const [officialTime, setOfficialTime] = useState(new Date());
  
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [events, setEvents] = useState<AuctionEvent[]>([]);
  const [lots, setLots] = useState<HorseLot[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, type: 'USER' | 'ADMIN'} | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const displayEvents = events.length > 0 ? events : MOCK_EVENTS;
  const displayLots = [...(lots.length > 0 ? lots : (selectedEventId ? MOCK_LOTS.filter(l => l.auctionId === selectedEventId) : []))]
    .sort((a, b) => a.lotNumber - b.lotNumber);

  const activeLot = displayLots.find(l => l.id === selectedLotId);
  const activeEvent = displayEvents.find(e => e.id === selectedEventId);

  useEffect(() => {
    if (!isGCPConfigured) {
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

    const unsubscribeEvents = streamActiveEvents((data) => {
      if (data.length > 0) setEvents(data);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeEvents();
    };
  }, []);

  useEffect(() => {
    if (!isGCPConfigured || !selectedEventId) return;

    const unsubscribeLots = streamLotsByEvent(selectedEventId, (data) => {
      setLots(data.map(l => ({
        ...l,
        endTime: l.endTime?.toDate ? l.endTime.toDate() : new Date(l.endTime),
        bids: l.bids || []
      })));
    });

    return () => unsubscribeLots();
  }, [selectedEventId]);

  // AUTOMATED REPASSE LOGIC
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setOfficialTime(now);

      // Check for lot expirations and trigger Repasse
      setLots(prevLots => prevLots.map(lot => {
        const timeDiff = new Date(lot.endTime).getTime() - now.getTime();
        
        if (timeDiff <= 0 && lot.status === AuctionStatus.ACTIVE) {
          if (lot.bids.length === 0) {
            // Immediate Repasse for 60 mins
            return {
              ...lot,
              status: AuctionStatus.REPURCHASE,
              endTime: new Date(now.getTime() + 60 * 60 * 1000)
            };
          } else {
            return { ...lot, status: AuctionStatus.SOLD };
          }
        }
        
        if (timeDiff <= 0 && lot.status === AuctionStatus.REPURCHASE) {
          return { ...lot, status: AuctionStatus.PASSED };
        }

        return lot;
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBid = async () => {
    if (!activeLot || !bidConfirmation || !currentUser) return;

    // Repasse Purchase Logic
    if (activeLot.status === AuctionStatus.REPURCHASE) {
      const purchaseBid: Bid = {
        id: `buy-${Date.now()}`,
        amount: activeLot.currentPrice,
        bidderName: `${currentUser.name} (COMPRA DIRETA)`,
        timestamp: new Date()
      };
      
      const updatedLot = { ...activeLot, status: AuctionStatus.SOLD, bids: [purchaseBid, ...activeLot.bids] };
      
      if (isGCPConfigured && db) {
        await updateDoc(doc(db, 'lots', activeLot.id), updatedLot);
      } else {
        setLots(lots.map(l => l.id === activeLot.id ? updatedLot : l));
      }
      
      setBidConfirmation(null);
      setNotification({ type: 'success', message: `PARABÉNS! LOTE ${activeLot.lotNumber} ADQUIRIDO COM SUCESSO!` });
      return;
    }

    // Normal Bidding Logic
    try {
      if (isGCPConfigured) {
        await placeBidGCP(activeLot.id, bidConfirmation.amount, currentUser.id, currentUser.name);
      } else {
        const newBid: Bid = {
          id: Date.now().toString(),
          amount: bidConfirmation.amount,
          bidderName: currentUser.name,
          timestamp: new Date()
        };
        activeLot.bids = [newBid, ...activeLot.bids];
        activeLot.currentPrice = bidConfirmation.amount;
      }
      setBidConfirmation(null);
      setNotification({ type: 'success', message: `LANCE DE ${formatCurrency(bidConfirmation.amount)} REGISTRADO!` });
    } catch (e: any) {
      setNotification({ type: 'error', message: `ERRO: ${e.message.toUpperCase()}` });
    }
  };

  const renderHeader = () => (
    <header className="bg-equus-navy text-white shadow-xl sticky top-0 z-50 border-b-2 border-equus-gold/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center h-24">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentView('HOME')}>
                <div className="w-12 h-12 border-2 border-equus-gold rounded-sm flex items-center justify-center font-serif font-bold text-equus-gold text-2xl shadow-[0_0_15px_rgba(197,160,89,0.4)]">H</div>
                <div className="flex flex-col">
                  <span className="font-serif font-bold text-xl tracking-[0.2em] leading-none text-white">HORSE BID</span>
                  <span className="text-[10px] uppercase tracking-[0.4em] text-equus-gold font-bold">Market Platform</span>
                </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
                <button onClick={() => setCurrentView('HOME')} className="text-xs font-bold uppercase hover:text-equus-gold tracking-widest transition-colors">Leilões</button>
                <button onClick={() => setCurrentView('SELLER')} className="text-xs font-bold uppercase hover:text-equus-gold tracking-widest transition-colors">Vender</button>
                {currentUser?.type === 'ADMIN' && (
                    <button onClick={() => setCurrentView('ADMIN')} className="text-xs font-bold uppercase text-equus-gold hover:text-white transition-colors">Gestão</button>
                )}
                
                {currentUser ? (
                    <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                        <span className="text-xs font-bold">{currentUser.name}</span>
                        <button onClick={() => isGCPConfigured ? firebaseSignOut(auth!) : setCurrentUser(null)} className="p-2 hover:bg-red-500/20 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-red-400" viewBox="0 0 16 16"><path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/><path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/></svg>
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <button onClick={() => setCurrentView('LOGIN')} className="text-xs font-bold uppercase hover:text-equus-gold transition-colors">Entrar</button>
                        <button onClick={() => setCurrentView('REGISTER')} className="bg-equus-gold text-equus-navy px-6 py-2.5 rounded-sm font-bold text-xs uppercase shadow-lg tracking-widest">Cadastro</button>
                    </div>
                )}
            </nav>
        </div>
    </header>
  );

  if (loading) return (
    <div className="h-screen bg-equus-navy flex flex-col items-center justify-center text-equus-gold">
        <div className="w-16 h-16 border-4 border-equus-gold border-t-transparent rounded-full animate-spin mb-6"></div>
        <span className="font-serif text-xl tracking-widest animate-pulse italic">Conectando Servidores Premium...</span>
    </div>
  );

  if (currentView === 'ADMIN') return (
    <AdminDashboard 
      events={displayEvents} 
      lots={lots} 
      users={users} 
      onCreateEvent={(e) => setEvents([...events, e])} 
      onUpdateLot={(l) => setLots(lots.map(lot => lot.id === l.id ? l : lot))}
      onUpdateUserStatus={(id, s) => setUsers(users.map(u => u.id === id ? {...u, status: s} : u))}
      onNavigateHome={() => setCurrentView('HOME')} 
    />
  );

  if (currentView === 'SELLER') return <>{renderHeader()}<SellerRegistration onCancel={() => setCurrentView('HOME')} onSubmit={() => setCurrentView('HOME')} /></>;
  if (currentView === 'LOGIN') return <Login onCancel={() => setCurrentView('HOME')} onSuccess={(u) => { setCurrentUser(u); setCurrentView('HOME'); }} onRegisterClick={() => setCurrentView('REGISTER')} />;
  if (currentView === 'REGISTER') return <UserRegistration onCancel={() => setCurrentView('HOME')} onSuccess={() => setCurrentView('LOGIN')} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {renderHeader()}
      {notification && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] px-8 py-4 rounded shadow-2xl animate-fade-in border-l-4 ${notification.type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'} text-white`}>
          <span className="text-sm font-bold uppercase tracking-widest">{notification.message}</span>
        </div>
      )}
      
      {currentView === 'HOME' && (
        <main className="max-w-7xl mx-auto px-4 py-24 flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-equus-navy uppercase tracking-tighter italic">Leilões em Destaque</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {displayEvents.map(evt => (
              <div key={evt.id} className="group bg-white rounded-sm overflow-hidden shadow-lg border border-gray-100 cursor-pointer" onClick={() => { setSelectedEventId(evt.id); setCurrentView('EVENT'); }}>
                <div className="relative h-72 overflow-hidden bg-equus-navy"><img src={evt.coverImage} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" alt={evt.title} /></div>
                <div className="p-10"><h3 className="text-3xl font-serif font-bold text-equus-navy mb-3 italic">{evt.title}</h3><p className="text-gray-500 text-sm mb-8">{evt.description}</p></div>
              </div>
            ))}
          </div>
        </main>
      )}

      {currentView === 'EVENT' && activeEvent && (
          <div className="max-w-7xl mx-auto px-4 py-12">
              <h2 className="text-6xl font-serif font-bold text-equus-navy mb-16 italic">{activeEvent.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                  {displayLots.map(lot => (
                      <AuctionCard key={lot.id} lot={lot} onClick={(id) => { setSelectedLotId(id); setCurrentView('DETAIL'); setActivePhotoIndex(0); }} />
                  ))}
              </div>
          </div>
      )}

      {currentView === 'DETAIL' && activeLot && (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    <div className="bg-white p-2 rounded-sm shadow-2xl border"><img src={activeLot.imageUrl} className="w-full h-[600px] object-cover" alt={activeLot.name}/></div>
                    <div className="bg-white p-12 rounded border"><h2 className="text-5xl font-serif font-bold text-equus-navy italic mb-6">{activeLot.name}</h2><p className="text-xl italic">"{activeLot.description}"</p></div>
                    <GeminiConsultant horse={activeLot} />
                </div>
                <div className="space-y-8">
                    <div className={`p-10 rounded shadow-2xl border-t-8 sticky top-28 bg-white transition-all duration-500 ${activeLot.status === AuctionStatus.REPURCHASE ? 'border-emerald-500' : 'border-equus-gold'}`}>
                        <div className={`mb-10 text-center p-6 rounded text-white ${activeLot.status === AuctionStatus.REPURCHASE ? 'bg-emerald-600' : 'bg-equus-navy'}`}>
                            <span className="text-[10px] uppercase font-bold tracking-widest mb-4 block">
                              {activeLot.status === AuctionStatus.REPURCHASE ? 'REPASSE DISPONÍVEL - COMPRE JÁ' : 'BATE-MARTELO EM'}
                            </span>
                            <Countdown endTime={activeLot.endTime} />
                        </div>
                        <div className="space-y-8">
                            <div className="flex justify-between items-end border-b pb-6">
                                <div><span className="text-xs uppercase font-bold text-gray-400">Preço do Lote</span><div className="text-4xl font-bold text-equus-navy">{activeLot.installments}x {formatCurrency(activeLot.currentPrice / activeLot.installments)}</div></div>
                            </div>
                            <button 
                              onClick={() => setBidConfirmation({ isOpen: true, amount: activeLot.currentPrice })}
                              className={`w-full py-6 rounded-sm font-bold uppercase tracking-[0.2em] transition-all shadow-xl text-sm ${activeLot.status === AuctionStatus.REPURCHASE ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-equus-navy hover:bg-equus-gold text-white'}`}
                            >
                                {activeLot.status === AuctionStatus.REPURCHASE ? 'COMPRAR IMEDIATAMENTE' : 'EFETUAR LANCE AGORA'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {bidConfirmation && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-fade-in">
              <div className="bg-white p-12 rounded-sm shadow-2xl max-w-md w-full text-center border-t-8 border-equus-gold">
                  <h3 className="text-2xl font-serif font-bold mb-6 text-equus-navy uppercase italic">Confirmar Operação</h3>
                  <p className="mb-10 text-gray-600">{activeLot?.status === AuctionStatus.REPURCHASE ? 'Confirma a compra direta deste lote pelo valor anunciado?' : 'Confirma o registro de seu lance oficial?'}</p>
                  <div className="flex flex-col gap-4">
                    <button onClick={handleBid} className="w-full bg-emerald-600 text-white py-5 rounded-sm font-bold uppercase">Confirmar</button>
                    <button onClick={() => setBidConfirmation(null)} className="text-xs font-bold text-gray-400 py-2">Cancelar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
