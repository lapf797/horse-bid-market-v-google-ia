
import React, { useState, useEffect } from 'react';
import { AuctionEvent, HorseLot, SellerSubmission, Bid, AuctionStatus } from './types';
import { MOCK_EVENTS, MOCK_LOTS, MOCK_SUBMISSIONS } from './services/mockData';
import { supabase, fetchActiveEvents, fetchLotsByEvent, placeRealBid } from './services/supabase';

import AuctionCard from './components/AuctionCard';
import GeminiConsultant from './components/GeminiConsultant';
import Countdown from './components/Countdown';
import SellerRegistration from './components/SellerRegistration';
import AdminDashboard from './components/AdminDashboard';
import UserRegistration from './components/UserRegistration';
import Login from './components/Login';

const formatCurrency = (val: number) => {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'HOME' | 'EVENT' | 'DETAIL' | 'SELLER' | 'REGISTER' | 'LOGIN' | 'ADMIN'>('HOME');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bidConfirmation, setBidConfirmation] = useState<{isOpen: boolean, amount: number, installmentValue: number} | null>(null);
  const [isLive, setIsLive] = useState(false);
  
  const [officialTime, setOfficialTime] = useState(new Date());

  const [events, setEvents] = useState<AuctionEvent[]>(MOCK_EVENTS);
  const [lots, setLots] = useState<HorseLot[]>(MOCK_LOTS);
  const [submissions, setSubmissions] = useState<SellerSubmission[]>(MOCK_SUBMISSIONS);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, type: 'USER' | 'ADMIN'} | null>(null);
  const [loading, setLoading] = useState(true);

  const activeLot = lots.find(l => l.id === selectedLotId);
  const activeEvent = events.find(e => e.id === selectedEventId);

  useEffect(() => {
    const init = async () => {
        // Check if Supabase keys are present
        const hasKeys = !!(process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY);
        setIsLive(hasKeys);

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setCurrentUser({ id: session.user.id, name: session.user.email || 'Usuário', type: 'USER' });
        }

        try {
            const dbEvents = await fetchActiveEvents();
            if (dbEvents && dbEvents.length > 0) {
                 const mappedEvents: AuctionEvent[] = dbEvents.map((e: any) => ({
                     id: e.id,
                     title: e.title,
                     description: e.description,
                     coverImage: e.cover_image,
                     startTime: new Date(e.start_time),
                     endTime: new Date(e.end_time),
                     status: e.status
                 }));
                 setEvents(mappedEvents);
            }
        } catch (e) {
            console.warn("Supabase Fetch failed, using Mocks.");
        }
        setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
      if (selectedEventId && isLive) {
          const loadLots = async () => {
              try {
                  const dbLots = await fetchLotsByEvent(selectedEventId);
                  if (dbLots && dbLots.length > 0) {
                      const mappedLots: HorseLot[] = dbLots.map((l: any) => ({
                          id: l.id,
                          auctionId: l.auction_id,
                          lotNumber: l.lot_number,
                          name: l.name,
                          breed: l.breed,
                          description: l.description,
                          imageUrl: l.image_url,
                          startPrice: l.start_price,
                          currentPrice: l.current_price,
                          incrementAmount: l.increment_amount,
                          installments: l.installments,
                          status: l.status,
                          endTime: new Date(l.end_time),
                          bids: l.bids.map((b: any) => ({
                              id: b.id || 'temp',
                              amount: b.amount,
                              timestamp: new Date(b.created_at),
                              bidderName: b.user_id === currentUser?.id ? 'Você' : 'Usuário ***'
                          })).sort((a: any, b: any) => b.amount - a.amount),
                          dob: '2020-01-01',
                          gender: 'Stallion',
                          sire: 'TBD',
                          dam: 'TBD',
                          damSire: 'TBD',
                          discipline: 'Salto',
                          height: '1.70m',
                          galleryImages: [l.image_url]
                      }));
                      setLots(mappedLots);
                  }
              } catch (e) {
                  console.error("Error loading lots", e);
              }
          };
          loadLots();
      }
  }, [selectedEventId, currentUser?.id, isLive]);

  useEffect(() => {
      if (!selectedEventId || !isLive) return;

      const channel = supabase.channel('auction-updates')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' }, (payload) => {
                const newBidRaw = payload.new;
                setLots(currentLots => currentLots.map(lot => {
                    if (lot.id === newBidRaw.lot_id) {
                        const newBid: Bid = {
                            id: newBidRaw.id,
                            bidderName: newBidRaw.user_id === currentUser?.id ? 'Você' : 'Novo Lance',
                            amount: newBidRaw.amount,
                            timestamp: new Date(newBidRaw.created_at)
                        };
                        return { ...lot, currentPrice: newBidRaw.amount, bids: [newBid, ...lot.bids] };
                    }
                    return lot;
                }));
            }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [selectedEventId, currentUser?.id, isLive]);

  useEffect(() => {
    const timer = setInterval(() => setOfficialTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const requestBid = (amount: number) => {
    if (!activeLot) return;
    if (!currentUser) { setCurrentView('LOGIN'); return; }
    if (activeLot.bids.length > 0 && activeLot.bids[0].bidderName === 'Você') return;
    setBidConfirmation({ isOpen: true, amount, installmentValue: amount / (activeLot.installments || 1) });
  };

  const confirmBid = async () => {
    if (!activeLot || !bidConfirmation || !currentUser) return;
    try {
        await placeRealBid(activeLot.id, bidConfirmation.amount, currentUser.id);
        setBidConfirmation(null);
    } catch (e) {
        alert("Erro ao enviar lance.");
    }
  };

  const renderHeader = () => (
      <header className="bg-equus-navy text-white shadow-md sticky top-0 z-50 border-b border-equus-gold/30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center relative h-20">
              <div className="flex items-center gap-2 cursor-pointer z-10" onClick={() => setCurrentView('HOME')}>
                  <div className="w-10 h-10 border-2 border-equus-gold rounded-sm flex items-center justify-center font-serif font-bold text-equus-gold text-xl">H</div>
                  <div className="flex flex-col">
                    <span className="font-serif font-bold text-lg tracking-widest leading-none">HORSE BID</span>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Market</span>
                  </div>
              </div>

              {!isLive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-equus-gold text-equus-navy px-4 py-0.5 rounded-b-lg text-[10px] font-bold uppercase tracking-widest shadow-lg">
                      Modo Demonstração (Sem Conexão Supabase)
                  </div>
              )}

              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:flex flex-col items-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Brasília</span>
                    <div className="text-xl font-mono font-bold text-equus-gold bg-equus-navy/80 px-4 py-1 rounded border border-equus-gold/20 shadow-inner">
                        {officialTime.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </div>
              </div>

              <nav className="hidden md:flex items-center gap-6 z-10">
                  <div className="flex gap-6 text-xs font-bold uppercase tracking-wider">
                      <button onClick={() => setCurrentView('HOME')} className="hover:text-equus-gold transition-colors">Leilões</button>
                      <button onClick={() => setCurrentView('SELLER')} className="hover:text-equus-gold transition-colors">Vender</button>
                  </div>
                  <div className="pl-6 border-l border-gray-700 flex items-center gap-3">
                      {currentUser ? (
                          <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-300">Olá, <strong>{currentUser.name}</strong></span>
                              <button onClick={async () => { await supabase.auth.signOut(); setCurrentUser(null); }} className="text-[10px] uppercase font-bold text-red-400 border border-red-400/50 px-2 py-1 rounded">Sair</button>
                          </div>
                      ) : (
                          <div className="flex gap-4">
                            <button onClick={() => setCurrentView('LOGIN')} className="text-white hover:text-equus-gold font-bold text-xs uppercase transition-colors">Entrar</button>
                            <button onClick={() => setCurrentView('REGISTER')} className="bg-equus-gold text-equus-navy px-5 py-2 rounded font-bold text-xs uppercase hover:bg-white transition-colors">Cadastre-se</button>
                          </div>
                      )}
                  </div>
              </nav>

              <button className="md:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     {isMobileMenuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
                 </svg>
              </button>
          </div>
      </header>
  );

  // ... (rest of render logic stays same, using currentView and activeLot as defined)
  if (currentView === 'ADMIN') return <AdminDashboard events={events} submissions={submissions} onCreateEvent={(e) => setEvents([...events, e])} onApproveSubmission={() => {}} onRejectSubmission={() => {}} onNavigateHome={() => setCurrentView('HOME')} />;
  if (currentView === 'SELLER') return <><renderHeader /><SellerRegistration onCancel={() => setCurrentView('HOME')} onSubmit={() => setCurrentView('HOME')} /></>;
  if (currentView === 'LOGIN') return <Login onCancel={() => setCurrentView('HOME')} onSuccess={(u) => { setCurrentUser({id: u.id, name: u.name, type: 'USER'}); setCurrentView('HOME'); }} onRegisterClick={() => setCurrentView('REGISTER')} />;
  if (currentView === 'REGISTER') return <UserRegistration onCancel={() => setCurrentView('HOME')} onSuccess={() => setCurrentView('LOGIN')} />;

  if (currentView === 'EVENT' && activeEvent) {
    const eventLots = lots.filter(l => l.auctionId === activeEvent.id);
    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {renderHeader()}
            <div className="relative bg-equus-navy text-white py-12 mb-8">
                  <div className="absolute inset-0 opacity-20"><img src={activeEvent.coverImage} className="w-full h-full object-cover" /></div>
                  <div className="max-w-7xl mx-auto px-4 relative z-10">
                      <button onClick={() => setCurrentView('HOME')} className="mb-4 text-xs font-bold uppercase text-gray-400 hover:text-white">← Voltar</button>
                      <h1 className="text-3xl font-serif font-bold mb-2">{activeEvent.title}</h1>
                      <p className="text-gray-300 max-w-2xl">{activeEvent.description}</p>
                  </div>
            </div>
            <main className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {eventLots.map(lot => <AuctionCard key={lot.id} lot={lot} onClick={(id) => {setSelectedLotId(id); setCurrentView('DETAIL');}} />)}
                </div>
            </main>
        </div>
    );
  }

  if (currentView === 'DETAIL' && activeLot) {
      const nextBid = activeLot.currentPrice + (activeLot.incrementAmount || 500);
      const userIsWinning = activeLot.bids.length > 0 && currentUser && activeLot.bids[0].bidderName === 'Você';
      return (
        <div className="min-h-screen bg-gray-50 pb-12 relative">
            {renderHeader()}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-black rounded-sm overflow-hidden aspect-video relative">
                            <img src={activeLot.imageUrl} className="w-full h-full object-contain" />
                        </div>
                        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                            <h3 className="font-serif font-bold text-equus-navy text-lg uppercase mb-4 border-b pb-2">Descrição</h3>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{activeLot.description}</p>
                        </div>
                        <GeminiConsultant horse={activeLot} />
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-sm shadow-lg border-t-4 border-equus-gold">
                            <h1 className="text-2xl font-serif font-bold text-equus-navy mb-4">{activeLot.name}</h1>
                            <div className="mb-6 p-4 bg-gray-50 rounded text-center"><Countdown endTime={activeLot.endTime} /></div>
                            <div className="mb-6">
                                <span className="text-sm text-gray-500 uppercase font-bold">Lance Atual</span>
                                <div className="text-3xl font-bold text-equus-navy">{activeLot.installments}x {formatCurrency(activeLot.currentPrice / activeLot.installments)}</div>
                            </div>
                            <button onClick={() => requestBid(nextBid)} disabled={userIsWinning} className={`w-full py-4 rounded font-bold uppercase tracking-widest transition-all ${userIsWinning ? 'bg-green-600 text-white' : 'bg-equus-gold text-white hover:bg-equus-navy'}`}>
                                {userIsWinning ? 'Você está ganhando!' : `Dar Lance (${activeLot.installments}x ${formatCurrency(nextBid / activeLot.installments)})`}
                            </button>
                        </div>
                        <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-4">
                            <h3 className="font-serif font-bold text-equus-navy uppercase text-sm mb-4">Lances Recentes</h3>
                            <div className="space-y-2">
                                {activeLot.bids.slice(0, 5).map(bid => (
                                    <div key={bid.id} className="flex justify-between text-sm py-2 border-b last:border-0">
                                        <span className="font-bold">{bid.bidderName}</span>
                                        <span>{formatCurrency(bid.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {bidConfirmation && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full overflow-hidden p-6 text-center">
                        <h3 className="text-equus-navy font-serif font-bold text-lg uppercase mb-4">Confirmar Lance</h3>
                        <div className="text-3xl font-bold text-equus-navy mb-1">{activeLot.installments}x {formatCurrency(bidConfirmation.installmentValue)}</div>
                        <button onClick={confirmBid} className="w-full bg-green-600 text-white py-3 rounded font-bold mt-6">Confirmar</button>
                        <button onClick={() => setBidConfirmation(null)} className="w-full text-gray-500 py-2 text-xs font-bold mt-2">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {renderHeader()}
      <div className="bg-equus-navy text-white py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"><img src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2069" className="w-full h-full object-cover" /></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">Excelência em Cada Lance</h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">O maior mercado premium de cavalos de esporte do Brasil.</p>
              <div className="flex justify-center gap-4">
                  <button className="bg-equus-gold text-equus-navy px-8 py-3 rounded font-bold uppercase">Ver Agenda</button>
                  <button onClick={() => setCurrentView('SELLER')} className="border border-white text-white px-8 py-3 rounded font-bold uppercase hover:bg-white hover:text-equus-navy transition-colors">Vender Cavalo</button>
              </div>
          </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-serif font-bold text-equus-navy mb-8 border-l-4 border-equus-gold pl-3">Leilões Ativos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {events.map(evt => (
                  <div key={evt.id} className="bg-white rounded shadow-sm overflow-hidden group cursor-pointer border hover:shadow-xl transition-all" onClick={() => { setSelectedEventId(evt.id); setCurrentView('EVENT'); }}>
                      <div className="h-64 overflow-hidden"><img src={evt.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>
                      <div className="p-8">
                          <h3 className="text-2xl font-serif font-bold text-equus-navy mb-2">{evt.title}</h3>
                          <p className="text-sm text-gray-600 mb-6">{evt.description}</p>
                          <button className="text-xs font-bold uppercase tracking-widest text-equus-navy group-hover:text-equus-gold">Acessar Catálogo →</button>
                      </div>
                  </div>
              ))}
          </div>
      </main>
    </div>
  );
};

export default App;
