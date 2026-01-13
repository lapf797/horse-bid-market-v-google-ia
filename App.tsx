
import React, { useState, useEffect } from 'react';
import { AuctionEvent, HorseLot, SellerSubmission, Bid, AuctionStatus, UserProfile, UserStatus } from './types';
import { MOCK_EVENTS, MOCK_LOTS } from './services/mockData';
import { auth, db, isGCPConfigured, streamActiveEvents, streamLotsByEvent, placeBidGCP } from './services/gcp';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, getDoc, collection, onSnapshot, updateDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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
  
  // Detalhes do Lote
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const [events, setEvents] = useState<AuctionEvent[]>([]);
  const [lots, setLots] = useState<HorseLot[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [submissions, setSubmissions] = useState<SellerSubmission[]>([]);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, type: 'USER' | 'ADMIN'} | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Notification State
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

    // Stream Events
    const unsubscribeEvents = streamActiveEvents((data) => {
      if (data.length > 0) setEvents(data);
      setLoading(false);
    });

    // Stream All Users for Admin
    let unsubscribeUsers = () => {};
    if (currentUser?.type === 'ADMIN') {
        const q = collection(db!, 'profiles');
        unsubscribeUsers = onSnapshot(q, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[]);
        });
    }

    return () => {
      unsubscribeAuth();
      unsubscribeEvents();
      unsubscribeUsers();
    };
  }, [currentUser?.type]);

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

  useEffect(() => {
    const timer = setInterval(() => setOfficialTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleBid = async () => {
    if (!activeLot || !bidConfirmation || !currentUser) return;
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
        await new Promise(resolve => setTimeout(resolve, 500));
        activeLot.bids = [newBid, ...activeLot.bids];
        activeLot.currentPrice = bidConfirmation.amount;
      }
      setBidConfirmation(null);
      setNotification({ type: 'success', message: `LANCE DE ${formatCurrency(bidConfirmation.amount)} REGISTRADO COM SUCESSO!` });
    } catch (e: any) {
      setNotification({ type: 'error', message: `ERRO NO LANCE: ${e.message.toUpperCase()}` });
    }
  };

  const handleAdminUpdateUserStatus = async (userId: string, status: UserStatus) => {
    if (!db) return;
    await updateDoc(doc(db, 'profiles', userId), { status });
    setNotification({ type: 'success', message: 'Status do usuário atualizado.' });
  };

  const handleAdminCreateLot = async (lot: HorseLot) => {
    if (!db) {
        setLots([...lots, lot]);
        return;
    }
    await setDoc(doc(db, 'lots', lot.id), lot);
    setNotification({ type: 'success', message: 'Lote criado com sucesso.' });
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

            <div className="flex items-center gap-8">
                <nav className="hidden md:flex items-center gap-8">
                    <button onClick={() => setCurrentView('HOME')} className="text-xs font-bold uppercase hover:text-equus-gold tracking-widest transition-colors">Leilões</button>
                    <button onClick={() => setCurrentView('SELLER')} className="text-xs font-bold uppercase hover:text-equus-gold tracking-widest transition-colors">Vender</button>
                    {currentUser?.type === 'ADMIN' && (
                        <button onClick={() => setCurrentView('ADMIN')} className="text-xs font-bold uppercase text-equus-gold hover:text-white transition-colors">Painel Gestão</button>
                    )}
                    
                    {currentUser ? (
                        <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase text-gray-400 font-bold">Usuário</span>
                                <span className="text-xs font-bold">{currentUser.name}</span>
                            </div>
                            <button onClick={() => isGCPConfigured ? firebaseSignOut(auth!) : setCurrentUser(null)} className="p-2 hover:bg-red-500/20 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-red-400" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                                    <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-4 items-center">
                            <button onClick={() => setCurrentView('LOGIN')} className="text-xs font-bold uppercase hover:text-equus-gold transition-colors">Entrar</button>
                            <button onClick={() => setCurrentView('REGISTER')} className="bg-equus-gold text-equus-navy px-6 py-2.5 rounded-sm font-bold text-xs uppercase hover:bg-white transition-all shadow-lg tracking-widest">Acesso</button>
                        </div>
                    )}
                </nav>
            </div>
        </div>
    </header>
  );

  const renderNotification = () => {
    if (!notification) return null;
    return (
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] px-8 py-4 rounded shadow-2xl animate-fade-in border-l-4 ${
        notification.type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'
      } text-white`}>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase tracking-widest">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-4 opacity-50 hover:opacity-100">&times;</button>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="h-screen bg-equus-navy flex flex-col items-center justify-center text-equus-gold">
        <div className="w-16 h-16 border-4 border-equus-gold border-t-transparent rounded-full animate-spin mb-6"></div>
        <span className="font-serif text-xl tracking-widest animate-pulse italic">Sincronizando Banco de Dados...</span>
    </div>
  );

  if (currentView === 'ADMIN') return (
    <AdminDashboard 
        events={events} 
        lots={lots}
        users={users}
        submissions={submissions} 
        onCreateEvent={(e) => setEvents([...events, e])}
        onUpdateEvent={(e) => setEvents(events.map(ev => ev.id === e.id ? e : ev))}
        onCreateLot={handleAdminCreateLot}
        onUpdateLot={(l) => setLots(lots.map(lot => lot.id === l.id ? l : lot))}
        onUpdateUserStatus={handleAdminUpdateUserStatus}
        onApproveSubmission={(id, cfg) => {
            const sub = submissions.find(s => s.id === id);
            if(sub) {
                const newLot: HorseLot = {
                    id: `lot-${id}`,
                    auctionId: cfg.eventId,
                    lotNumber: cfg.lotNumber,
                    name: sub.name,
                    breed: sub.breed,
                    dob: sub.dob,
                    gender: sub.gender,
                    sire: sub.sire,
                    dam: sub.dam,
                    damSire: sub.damSire,
                    discipline: sub.discipline,
                    height: sub.height,
                    description: sub.description,
                    imageUrl: sub.galleryPhotos[0],
                    galleryImages: sub.galleryPhotos,
                    startPrice: cfg.startPrice,
                    currentPrice: cfg.startPrice,
                    incrementAmount: cfg.increment,
                    installments: 30,
                    status: AuctionStatus.ACTIVE,
                    endTime: new Date(Date.now() + 86400000),
                    bids: []
                };
                handleAdminCreateLot(newLot);
                setSubmissions(submissions.filter(s => s.id !== id));
            }
        }}
        onRejectSubmission={(id) => setSubmissions(submissions.filter(s => s.id !== id))}
        onNavigateHome={() => setCurrentView('HOME')} 
    />
  );

  if (currentView === 'SELLER') return <>{renderHeader()}<SellerRegistration onCancel={() => setCurrentView('HOME')} onSubmit={() => setCurrentView('HOME')} /></>;
  if (currentView === 'LOGIN') return <Login onCancel={() => setCurrentView('HOME')} onSuccess={(u) => { setCurrentUser(u); setCurrentView('HOME'); }} onRegisterClick={() => setCurrentView('REGISTER')} />;
  if (currentView === 'REGISTER') return <UserRegistration onCancel={() => setCurrentView('HOME')} onSuccess={() => setCurrentView('LOGIN')} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {renderHeader()}
      {renderNotification()}
      
      {currentView === 'HOME' && (
        <>
          <div className="bg-equus-navy text-white py-32 md:py-48 relative overflow-hidden border-b-8 border-equus-gold">
            <div className="absolute inset-0 opacity-40">
                <img src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=2071&auto=format&fit=crop" className="w-full h-full object-cover" alt="Elite Horse" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-equus-navy via-equus-navy/80 to-transparent"></div>
            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <span className="h-px w-12 bg-equus-gold"></span>
                    <span className="text-equus-gold font-bold tracking-[0.5em] uppercase text-xs">Premium Auction Network</span>
                </div>
                <h1 className="text-7xl md:text-[10rem] font-serif font-bold mb-8 drop-shadow-2xl italic tracking-tighter leading-none">
                    Horse <span className="text-equus-gold">Bid</span>
                </h1>
                <p className="text-2xl text-gray-300 max-w-2xl mb-12 font-light leading-relaxed">
                    Experiência definitiva em negociação de equinos de elite. 
                    <span className="block mt-4 text-equus-gold font-bold uppercase text-sm tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Operação Profissional em Tempo Real
                    </span>
                </p>
            </div>
          </div>
          
          <main className="max-w-7xl mx-auto px-4 py-24 flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                  <div>
                      <h2 className="text-4xl md:text-5xl font-serif font-bold text-equus-navy uppercase tracking-tighter italic">Próximos Leilões</h2>
                      <div className="h-1 w-24 bg-equus-gold mt-2"></div>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {displayEvents.map(evt => (
                      <div 
                        key={evt.id} 
                        className="group bg-white rounded-sm overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                        onClick={() => { setSelectedEventId(evt.id); setCurrentView('EVENT'); }}
                      >
                          <div className="relative h-72 overflow-hidden bg-equus-navy">
                            <img src={evt.coverImage} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" alt={evt.title} />
                            <div className="absolute top-6 left-6 flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                Ao Vivo
                            </div>
                          </div>
                          <div className="p-10">
                              <h3 className="text-3xl font-serif font-bold text-equus-navy mb-3 tracking-tight group-hover:text-equus-gold transition-colors italic leading-none">{evt.title}</h3>
                              <p className="text-gray-500 text-sm line-clamp-2 font-light leading-relaxed mb-8">{evt.description}</p>
                              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                                  <div className="flex flex-col">
                                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Encerramento</span>
                                      <span className="text-lg tracking-tighter text-equus-navy font-bold">{formatDate(evt.endTime)}</span>
                                  </div>
                                  <button className="bg-equus-navy text-white px-8 py-3.5 rounded-sm font-bold uppercase text-[10px] tracking-widest hover:bg-equus-gold transition-all">Catálogo</button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </main>
        </>
      )}

      {currentView === 'EVENT' && activeEvent && (
          <div className="flex-1 bg-white">
              <div className="max-w-7xl mx-auto px-4 py-12">
                  <button onClick={() => setCurrentView('HOME')} className="mb-12 flex items-center gap-2 text-xs font-bold uppercase text-gray-400 hover:text-equus-navy transition-colors tracking-widest">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/></svg>
                      Eventos
                  </button>
                  <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16 border-b-2 border-gray-100 pb-12">
                      <div>
                        <h2 className="text-6xl font-serif font-bold text-equus-navy mb-4 tracking-tighter italic">{activeEvent.title}</h2>
                        <p className="text-xl text-gray-500 italic max-w-2xl">Catálogo oficial com curadoria especializada.</p>
                      </div>
                      <div className="bg-equus-navy text-white p-6 rounded shadow-xl flex flex-col items-center min-w-[300px] border-b-4 border-equus-gold">
                           <span className="text-[10px] uppercase font-bold text-gray-400 mb-2">Contagem Regressiva</span>
                           <Countdown endTime={activeEvent.endTime} />
                      </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                      {displayLots.map(lot => (
                          <AuctionCard key={lot.id} lot={lot} onClick={(id) => { setSelectedLotId(id); setCurrentView('DETAIL'); setActivePhotoIndex(0); }} />
                      ))}
                  </div>
              </div>
          </div>
      )}

      {currentView === 'DETAIL' && activeLot && (
        <div className="flex-1 bg-gray-50 pb-24">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <button onClick={() => setCurrentView('EVENT')} className="mb-8 flex items-center gap-2 text-xs font-bold uppercase text-gray-400 hover:text-equus-navy transition-colors tracking-widest">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/></svg>
                    Catálogo
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        <div className="bg-white p-2 rounded-sm shadow-2xl border flex flex-col gap-4">
                             <div className="relative h-[600px] bg-gray-100 overflow-hidden">
                                <img src={(activeLot.galleryImages || [activeLot.imageUrl])[activePhotoIndex]} className="w-full h-full object-cover rounded-sm transition-all duration-500" alt={activeLot.name}/>
                             </div>
                             <div className="grid grid-cols-6 gap-2">
                                {(activeLot.galleryImages || [activeLot.imageUrl]).slice(0, 6).map((img, idx) => (
                                    <button key={idx} onClick={() => setActivePhotoIndex(idx)} className={`aspect-video rounded border-2 transition-all ${activePhotoIndex === idx ? 'border-equus-gold' : 'border-transparent opacity-60'}`}><img src={img} className="w-full h-full object-cover rounded-sm" /></button>
                                ))}
                             </div>
                        </div>
                        <div className="bg-white p-12 rounded shadow-sm border border-gray-200">
                            <h2 className="text-5xl font-serif font-bold text-equus-navy tracking-tight italic mb-8">{activeLot.name}</h2>
                            <p className="text-xl text-gray-700 leading-relaxed font-light italic">"{activeLot.description}"</p>
                        </div>
                        <GeminiConsultant horse={activeLot} />
                    </div>
                    <div className="space-y-8">
                        <div className="bg-white p-10 rounded shadow-2xl border-t-8 border-equus-gold sticky top-28">
                            <div className="mb-10 text-center bg-equus-navy text-white p-6 rounded border-b-4 border-equus-gold">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-4 block">Tempo para Lances</span>
                                <Countdown endTime={activeLot.endTime} />
                            </div>
                            <div className="space-y-8">
                                <div className="flex justify-between items-end border-b border-gray-100 pb-6">
                                    <div>
                                        <span className="text-xs uppercase font-bold text-gray-400 tracking-widest">Lance Atual</span>
                                        <div className="text-4xl font-bold text-equus-navy tracking-tighter mt-1">{activeLot.installments}x {formatCurrency(activeLot.currentPrice / activeLot.installments)}</div>
                                    </div>
                                </div>
                                <button onClick={() => setBidConfirmation({ isOpen: true, amount: activeLot.currentPrice + (activeLot.incrementAmount || 500) })} className="w-full bg-equus-navy text-white py-6 rounded-sm font-bold uppercase tracking-[0.2em] hover:bg-equus-gold transition-all shadow-xl text-sm">Efetuar Lance Seguro</button>
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                  <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] mb-4">Lances Recentes</h4>
                                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {activeLot.bids.map((bid, idx) => (
                                      <div key={bid.id} className={`flex justify-between items-center p-3 rounded-sm text-xs border border-gray-100 ${idx === 0 ? 'animate-new-bid border-equus-gold/30 bg-equus-gold/5' : ''}`}>
                                        <span className="font-bold text-equus-navy">{bid.bidderName}</span>
                                        <span className="font-mono font-bold">{formatCurrency(bid.amount)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {bidConfirmation && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-fade-in">
              <div className="bg-white p-12 rounded-sm shadow-2xl max-w-md w-full text-center border-t-8 border-equus-gold">
                  <h3 className="text-2xl font-serif font-bold mb-6 text-equus-navy uppercase tracking-widest italic">Confirmar Lance</h3>
                  <p className="mb-10 text-gray-600">Deseja confirmar seu lance de {formatCurrency(bidConfirmation.amount)} para este lote?</p>
                  <div className="flex flex-col gap-4">
                    <button onClick={handleBid} className="w-full bg-emerald-600 text-white py-5 rounded-sm font-bold uppercase tracking-widest shadow-xl">Confirmar</button>
                    <button onClick={() => setBidConfirmation(null)} className="text-xs font-bold text-gray-400 uppercase tracking-widest py-2">Cancelar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
