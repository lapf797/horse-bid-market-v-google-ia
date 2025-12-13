
import React, { useState, useEffect } from 'react';
import { AuctionEvent, HorseLot, SellerSubmission, Bid, AuctionStatus } from './types';
import { MOCK_EVENTS, MOCK_LOTS, MOCK_SUBMISSIONS } from './services/mockData'; // Keeping as fallback for UI rendering if Supabase is empty
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
  
  // Official Time State
  const [officialTime, setOfficialTime] = useState(new Date());

  // Data State (Starting with Mock, but will overwrite with Supabase)
  const [events, setEvents] = useState<AuctionEvent[]>(MOCK_EVENTS);
  const [lots, setLots] = useState<HorseLot[]>(MOCK_LOTS);
  const [submissions, setSubmissions] = useState<SellerSubmission[]>(MOCK_SUBMISSIONS);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, type: 'USER' | 'ADMIN'} | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived State
  const activeLot = lots.find(l => l.id === selectedLotId);
  const activeEvent = events.find(e => e.id === selectedEventId);

  // 1. Initial Data Fetch & Auth Check
  useEffect(() => {
    const init = async () => {
        // Check Session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setCurrentUser({ 
                id: session.user.id, 
                name: session.user.email || 'Usuário', 
                type: 'USER' 
            });
        }

        try {
            // Fetch Events
            const dbEvents = await fetchActiveEvents();
            if (dbEvents && dbEvents.length > 0) {
                 // Map Supabase events to our Type
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
            console.error("Supabase not configured or empty, using Mocks.");
        }
        setLoading(false);
    };
    init();
  }, []);

  // 2. Load Lots when Event Selected
  useEffect(() => {
      if (selectedEventId) {
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
                          dob: '2020-01-01', // Mocking fields not in DB simplified schema
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
  }, [selectedEventId, currentUser?.id]);

  // 3. Realtime Subscription (The Heart of the Auction)
  useEffect(() => {
      if (!selectedEventId) return;

      const channel = supabase.channel('auction-updates')
        .on(
            'postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'bids' },
            (payload) => {
                // New Bid Detected!
                const newBidRaw = payload.new;
                
                setLots(currentLots => currentLots.map(lot => {
                    if (lot.id === newBidRaw.lot_id) {
                        const newBid: Bid = {
                            id: newBidRaw.id,
                            bidderName: newBidRaw.user_id === currentUser?.id ? 'Você' : 'Novo Lance',
                            amount: newBidRaw.amount,
                            timestamp: new Date(newBidRaw.created_at)
                        };
                        return { 
                            ...lot, 
                            currentPrice: newBidRaw.amount, 
                            bids: [newBid, ...lot.bids] 
                        };
                    }
                    return lot;
                }));
            }
        )
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'lots' },
            (payload) => {
                // Lot Status Update (e.g., SOLD)
                const updatedLot = payload.new;
                setLots(currentLots => currentLots.map(lot => {
                    if (lot.id === updatedLot.id) {
                        return { ...lot, status: updatedLot.status };
                    }
                    return lot;
                }));
            }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [selectedEventId, currentUser?.id]);


  // Clock Ticker & Local Status Check (Keep this for UI countdowns)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setOfficialTime(now);

      // We only update status visually here. Real status is authority of DB.
      setLots(prevLots => prevLots.map(lot => {
          if (lot.status === AuctionStatus.ACTIVE && now > new Date(lot.endTime)) {
               // In a real app, backend cron job updates status. Frontend just waits for sync.
               // We will tentatively mark as processed to stop countdown.
          }
          return lot;
      }));

    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handlers
  const requestBid = (amount: number) => {
    if (!activeLot) return;
    
    if (!currentUser) {
        alert("Por favor, faça login para dar lances.");
        setCurrentView('LOGIN');
        return;
    }

    if (activeLot.bids.length > 0 && activeLot.bids[0].bidderName === 'Você') {
        alert("Você já possui o maior lance atual!");
        return;
    }

    setBidConfirmation({
        isOpen: true,
        amount,
        installmentValue: amount / (activeLot.installments || 1)
    });
  };

  const confirmBid = async () => {
    if (!activeLot || !bidConfirmation || !currentUser) return;
    
    try {
        await placeRealBid(activeLot.id, bidConfirmation.amount, currentUser.id);
        setBidConfirmation(null);
        alert("Lance enviado! Aguarde a confirmação em tempo real.");
    } catch (e) {
        alert("Erro ao enviar lance. Tente novamente.");
        console.error(e);
    }
  };

  const handleBuyNow = async () => {
    if (!activeLot || !currentUser) return;
    
    if (window.confirm(`Confirma a compra imediata deste lote por ${formatCurrency(activeLot.currentPrice)}?`)) {
         try {
             // Update DB status to SOLD
             await supabase.from('lots').update({ status: 'SOLD' }).eq('id', activeLot.id);
             // Insert 'Buy Now' bid
             await placeRealBid(activeLot.id, activeLot.currentPrice, currentUser.id);
             
             alert("Parabéns! Lote adquirido com sucesso.");
         } catch (e) {
             console.error("Erro na compra", e);
         }
    }
  };

  const handleAdminAction = {
      createEvent: (evt: AuctionEvent) => setEvents([...events, evt]),
      approveSubmission: (subId: string, config: any) => {
         setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, status: 'APPROVED' } : s));
      },
      rejectSubmission: (subId: string) => {
          setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, status: 'REJECTED' } : s));
      }
  };

  const navigateToEvent = (id: string) => {
      setSelectedEventId(id);
      setCurrentView('EVENT');
      window.scrollTo(0, 0);
  };

  const navigateToLot = (id: string) => {
      setSelectedLotId(id);
      setCurrentView('DETAIL');
      window.scrollTo(0, 0);
  };

  const handleMobileNav = (view: typeof currentView) => {
      setCurrentView(view);
      setIsMobileMenuOpen(false);
  };

  // View Components (Render Header Helper)
  const renderHeader = () => (
      <header className="bg-equus-navy text-white shadow-md sticky top-0 z-50 border-b border-equus-gold/30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center relative h-20">
              
              <div className="flex items-center gap-2 cursor-pointer z-10" onClick={() => setCurrentView('HOME')}>
                  <div className="w-10 h-10 bg-transparent border-2 border-equus-gold rounded-sm flex items-center justify-center font-serif font-bold text-equus-gold text-xl">H</div>
                  <div className="flex flex-col">
                    <span className="font-serif font-bold text-lg tracking-widest leading-none">HORSE BID</span>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Market</span>
                  </div>
              </div>

              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:flex flex-col items-center justify-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Horário Oficial (Brasília)</span>
                    <div className="text-xl font-mono font-bold text-equus-gold bg-equus-navy/80 px-4 py-1 rounded border border-equus-gold/20 shadow-inner">
                        {officialTime.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </div>
              </div>

              <nav className="hidden md:flex items-center gap-6 z-10">
                  <div className="flex gap-6 text-xs font-bold uppercase tracking-wider">
                      <button onClick={() => setCurrentView('HOME')} className="hover:text-equus-gold transition-colors">Leilões</button>
                      <button onClick={() => setCurrentView('SELLER')} className="hover:text-equus-gold transition-colors">Vender</button>
                      {currentUser?.type === 'ADMIN' && (
                          <button onClick={() => setCurrentView('ADMIN')} className="text-equus-gold">Admin</button>
                      )}
                  </div>
                  
                  <div className="pl-6 border-l border-gray-700 flex items-center gap-3">
                      {currentUser ? (
                          <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-300">Olá, <strong className="text-white">{currentUser.name}</strong></span>
                              <button onClick={async () => { await supabase.auth.signOut(); setCurrentUser(null); }} className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 border border-red-400/50 px-2 py-1 rounded">Sair</button>
                          </div>
                      ) : (
                          <>
                            <button 
                                onClick={() => setCurrentView('LOGIN')} 
                                className="text-white hover:text-equus-gold font-bold text-xs uppercase tracking-wider transition-colors"
                            >
                                Entrar
                            </button>
                            <button 
                                onClick={() => setCurrentView('REGISTER')} 
                                className="bg-equus-gold text-equus-navy px-5 py-2 rounded font-bold text-xs uppercase hover:bg-white transition-colors shadow-sm tracking-wide"
                            >
                                Cadastre-se
                            </button>
                          </>
                      )}
                  </div>
              </nav>

              <button 
                className="md:hidden text-white p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     {isMobileMenuOpen ? (
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     ) : (
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                     )}
                 </svg>
              </button>
          </div>

          {isMobileMenuOpen && (
              <div className="md:hidden bg-equus-navy border-t border-gray-700 p-4 absolute top-20 left-0 w-full z-50 animate-fade-in shadow-2xl">
                  <nav className="flex flex-col gap-4 text-sm font-bold uppercase tracking-wider">
                      <button onClick={() => handleMobileNav('HOME')} className="text-left py-2 border-b border-gray-700 hover:text-equus-gold">Leilões</button>
                      <button onClick={() => handleMobileNav('SELLER')} className="text-left py-2 border-b border-gray-700 hover:text-equus-gold">Vender Cavalo</button>
                      {currentUser?.type === 'ADMIN' && (
                          <button onClick={() => handleMobileNav('ADMIN')} className="text-left py-2 border-b border-gray-700 text-equus-gold">Administração</button>
                      )}
                      
                      {currentUser ? (
                           <div className="py-4 flex justify-between items-center">
                               <span className="text-gray-300">Olá, {currentUser.name}</span>
                               <button onClick={async () => { await supabase.auth.signOut(); setCurrentUser(null); setIsMobileMenuOpen(false); }} className="text-red-400 border border-red-400 px-3 py-1 rounded">Sair</button>
                           </div>
                      ) : (
                          <div className="grid grid-cols-2 gap-4 mt-2">
                              <button onClick={() => handleMobileNav('LOGIN')} className="py-3 border border-gray-500 rounded text-center hover:bg-gray-800">Entrar</button>
                              <button onClick={() => handleMobileNav('REGISTER')} className="py-3 bg-equus-gold text-equus-navy rounded text-center hover:bg-white">Cadastre-se</button>
                          </div>
                      )}
                  </nav>
              </div>
          )}

          <div className="md:hidden bg-equus-navy border-t border-gray-800 py-1 text-center">
               <span className="text-[10px] text-gray-400 uppercase mr-2">Brasília:</span>
               <span className="font-mono text-xs font-bold text-equus-gold">
                   {officialTime.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
               </span>
          </div>
      </header>
  );

  if (currentView === 'ADMIN') {
      return (
        <AdminDashboard 
            events={events}
            submissions={submissions}
            onCreateEvent={handleAdminAction.createEvent}
            onApproveSubmission={handleAdminAction.approveSubmission}
            onRejectSubmission={handleAdminAction.rejectSubmission}
            onNavigateHome={() => setCurrentView('HOME')}
        />
      );
  }

  if (currentView === 'SELLER') {
      return (
          <>
            {renderHeader()}
            <SellerRegistration 
                onCancel={() => setCurrentView('HOME')} 
                onSubmit={(sub) => {
                    setSubmissions([...submissions, sub]);
                    alert("Cadastro enviado para análise!");
                    setCurrentView('HOME');
                }}
            />
          </>
      );
  }

  if (currentView === 'LOGIN') {
      return (
          <Login
            onCancel={() => setCurrentView('HOME')}
            onSuccess={(user) => {
                setCurrentUser({ id: user.id, name: user.name || 'Usuário', type: 'USER' });
                setCurrentView('HOME');
            }}
            onRegisterClick={() => setCurrentView('REGISTER')}
          />
      );
  }

  if (currentView === 'REGISTER') {
      return (
          <UserRegistration 
            onCancel={() => setCurrentView('HOME')}
            onSuccess={() => {
                setCurrentView('LOGIN'); // Redirect to login after registration
            }}
          />
      );
  }

  // EVENT DETAIL VIEW (List of Lots for a specific event)
  if (currentView === 'EVENT' && activeEvent) {
    const eventLots = lots.filter(l => l.auctionId === activeEvent.id);

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {renderHeader()}
            
            <div className="relative bg-equus-navy text-white py-12 mb-8">
                  <div className="absolute inset-0 opacity-20">
                      <img src={activeEvent.coverImage} className="w-full h-full object-cover" />
                  </div>
                  <div className="max-w-7xl mx-auto px-4 relative z-10">
                      <button onClick={() => setCurrentView('HOME')} className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-1">
                          ← Voltar para Eventos
                      </button>
                      <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">{activeEvent.title}</h1>
                      <p className="text-gray-300 max-w-2xl">{activeEvent.description}</p>
                      <div className="mt-6 flex gap-6 text-sm">
                           <div>
                               <span className="block text-xs text-gray-400 uppercase">Abertura</span>
                               <span className="font-bold">{activeEvent.startTime.toLocaleDateString()}</span>
                           </div>
                      </div>
                  </div>
            </div>

            <main className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-equus-navy uppercase tracking-wide border-l-4 border-equus-gold pl-3">
                        Catálogo ({eventLots.length} Lotes)
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {eventLots.map(lot => (
                        <AuctionCard 
                            key={lot.id} 
                            lot={lot} 
                            onClick={navigateToLot}
                            onBuyNow={() => alert('Entre nos detalhes para comprar.')}
                        />
                    ))}
                    {eventLots.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white rounded border border-gray-200">
                            <p className="text-gray-500">Nenhum lote cadastrado para este evento ainda.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
  }

  // LOT DETAIL VIEW
  if (currentView === 'DETAIL' && activeLot) {
      const nextBid = activeLot.currentPrice + (activeLot.incrementAmount || 500);
      const userIsWinning = activeLot.bids.length > 0 && currentUser && activeLot.bids[0].bidderName === 'Você';

      // Determine text for countdown based on status
      let countdownText = "Encerrado";
      if (activeLot.status === AuctionStatus.REPURCHASE) {
          countdownText = "Repasse";
      } else if (activeLot.status === AuctionStatus.SOLD) {
          countdownText = "Vendido";
      }

      return (
        <div className="min-h-screen bg-gray-50 pb-12 relative">
            {renderHeader()}
            
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Breadcrumbs */}
                <div className="mb-6 text-sm text-gray-500 flex items-center gap-2">
                    <button onClick={() => setCurrentView('HOME')} className="hover:text-equus-navy hover:underline">Leilões</button>
                    <span>/</span>
                    <button onClick={() => navigateToEvent(activeLot.auctionId)} className="hover:text-equus-navy hover:underline">Evento</button>
                    <span>/</span>
                    <span className="font-bold text-gray-800">Lote {activeLot.lotNumber}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: IMAGES & MEDIA */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-black rounded-sm overflow-hidden shadow-lg relative aspect-video group">
                            <img src={activeLot.imageUrl} className="w-full h-full object-contain" alt={activeLot.name} />
                            <div className="absolute top-4 left-4">
                                <span className="bg-equus-gold text-equus-navy font-bold px-3 py-1 rounded text-sm uppercase tracking-wider">
                                    Lote {activeLot.lotNumber}
                                </span>
                            </div>
                        </div>
                        
                        {/* Gallery */}
                        {activeLot.galleryImages && (
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                {activeLot.galleryImages.map((img, idx) => (
                                    <div key={idx} className="aspect-square bg-gray-200 rounded cursor-pointer overflow-hidden border-2 border-transparent hover:border-equus-gold">
                                        <img src={img} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                            <h3 className="font-serif font-bold text-equus-navy text-lg uppercase mb-4 pb-2 border-b border-gray-100">Descrição do Lote</h3>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                {activeLot.description}
                            </p>
                            
                            {activeLot.sellerNotes && (
                                <div className="mt-4 p-4 bg-yellow-50 text-yellow-900 rounded text-sm italic">
                                    " {activeLot.sellerNotes} "
                                    <div className="mt-1 font-bold not-italic text-xs uppercase opacity-70">- Notas do Vendedor</div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
                                <div><span className="block text-xs text-gray-500 uppercase">Raça</span><strong className="text-equus-navy">{activeLot.breed}</strong></div>
                                <div><span className="block text-xs text-gray-500 uppercase">Nascimento</span><strong className="text-equus-navy">{new Date(activeLot.dob).toLocaleDateString('pt-BR')}</strong></div>
                                <div><span className="block text-xs text-gray-500 uppercase">Sexo</span><strong className="text-equus-navy">{activeLot.gender}</strong></div>
                                <div><span className="block text-xs text-gray-500 uppercase">Pai</span><strong className="text-equus-navy">{activeLot.sire}</strong></div>
                                <div><span className="block text-xs text-gray-500 uppercase">Mãe</span><strong className="text-equus-navy">{activeLot.dam}</strong></div>
                                <div><span className="block text-xs text-gray-500 uppercase">Avô Materno</span><strong className="text-equus-navy">{activeLot.damSire}</strong></div>
                            </div>
                        </div>

                        {/* AI CONSULTANT */}
                        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                             <h3 className="font-serif font-bold text-equus-navy text-lg uppercase mb-4">Consultor Especialista (IA)</h3>
                             <p className="text-sm text-gray-500 mb-4">Tire dúvidas técnicas sobre a genealogia e aptidão deste animal.</p>
                             <GeminiConsultant horse={activeLot} />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: BIDDING & INFO */}
                    <div className="space-y-6">
                        {/* BIDDING BOX - STATIC (Not Sticky) */}
                        <div className="bg-white p-6 rounded-sm shadow-lg border-t-4 border-equus-gold relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-2xl font-serif font-bold text-equus-navy leading-tight">{activeLot.name}</h1>
                            </div>

                            <div className="mb-6 p-4 bg-gray-50 rounded text-center">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Tempo Restante</div>
                                <Countdown endTime={activeLot.endTime} finishedText={countdownText} />
                            </div>

                            <div className="mb-6">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-sm text-gray-500 uppercase font-bold">Lance Atual</span>
                                    <span className="text-3xl font-bold text-equus-navy">
                                        {activeLot.installments}x {formatCurrency(activeLot.currentPrice / activeLot.installments)}
                                    </span>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                    Total: {formatCurrency(activeLot.currentPrice)}
                                </div>
                            </div>

                            {activeLot.status === AuctionStatus.ACTIVE ? (
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => requestBid(nextBid)}
                                        disabled={userIsWinning}
                                        className={`w-full py-4 rounded shadow-md font-bold uppercase tracking-widest transition-all text-lg ${
                                            userIsWinning 
                                            ? 'bg-green-600 text-white cursor-default' 
                                            : 'bg-equus-gold text-white hover:bg-equus-navy hover:text-white'
                                        }`}
                                    >
                                        {userIsWinning ? 'Você está ganhando!' : `Dar Lance (${activeLot.installments}x ${formatCurrency(nextBid / activeLot.installments)})`}
                                    </button>
                                    {!userIsWinning && (
                                        <p className="text-xs text-center text-gray-400">
                                            Ao dar o lance, você concorda com os termos do leilão.
                                        </p>
                                    )}
                                </div>
                            ) : activeLot.status === AuctionStatus.REPURCHASE ? (
                                <div className="space-y-3">
                                    <button 
                                        onClick={handleBuyNow}
                                        className="w-full bg-green-600 text-white text-center py-4 rounded shadow-md uppercase text-lg font-bold tracking-widest animate-pulse hover:bg-green-500 transition-colors"
                                    >
                                        Compre Já
                                    </button>
                                    <div className="bg-green-50 text-green-800 text-center p-2 text-xs border border-green-200 rounded">
                                        Lote disponível para repasse imediato
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-200 text-gray-500 py-3 text-center font-bold uppercase rounded">
                                    Lote Arrematado
                                </div>
                            )}
                        </div>

                        {/* BID HISTORY TABLE */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                          <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                              <h3 className="font-serif font-bold text-equus-navy uppercase tracking-widest text-sm">Histórico de Lances</h3>
                              <span className="text-xs text-gray-500">{activeLot.bids.length} lances</span>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                              <table className="w-full text-sm">
                                  <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-xs sticky top-0">
                                      <tr>
                                          <th className="px-4 py-2 text-left">Data / Hora</th>
                                          <th className="px-4 py-2 text-left">Usuário</th>
                                          <th className="px-4 py-2 text-right">Valor da Parcela</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                      {[...activeLot.bids]
                                          .sort((a, b) => b.amount - a.amount)
                                          .map((bid, index) => (
                                          <tr key={bid.id} className={`hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-yellow-50/50' : ''}`}>
                                              <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                                                  {bid.timestamp.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                  <span className="mx-2 text-gray-300">|</span>
                                                  {bid.timestamp.toLocaleTimeString('pt-BR')}
                                              </td>
                                              <td className="px-4 py-3 font-bold text-equus-navy">
                                                  {bid.bidderName}
                                                  {bid.bidderName === 'Você' && <span className="ml-2 text-[10px] bg-equus-gold text-white px-1 rounded">EU</span>}
                                              </td>
                                              <td className={`px-4 py-3 text-right font-bold ${index === 0 ? 'text-equus-gold' : 'text-gray-600'}`}>
                                                  {formatCurrency(bid.amount / (activeLot.installments || 1))}
                                              </td>
                                          </tr>
                                      ))}
                                      {activeLot.bids.length === 0 && (
                                          <tr>
                                              <td colSpan={3} className="px-4 py-8 text-center text-gray-400 italic">
                                                  Nenhum lance registrado ainda.
                                              </td>
                                          </tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                        </div>

                        {/* DOCUMENTS */}
                        {activeLot.documents && activeLot.documents.length > 0 && (
                             <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-6">
                                <h3 className="font-serif font-bold text-equus-navy uppercase tracking-widest text-sm mb-4">Documentos</h3>
                                <ul className="space-y-2">
                                    {activeLot.documents.map((doc, idx) => (
                                        <li key={idx}>
                                            <a href={doc.url} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                {doc.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                             </div>
                        )}
                    </div>
                </div>

                {/* BID CONFIRMATION MODAL */}
                {bidConfirmation && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full overflow-hidden animate-new-bid">
                            <div className="bg-equus-navy p-4 text-center">
                                <h3 className="text-white font-serif font-bold text-lg uppercase tracking-widest">Confirmar Lance</h3>
                            </div>
                            <div className="p-6 text-center">
                                <p className="text-gray-500 text-sm mb-2">Você está prestes a dar um lance de:</p>
                                <div className="text-3xl font-bold text-equus-navy mb-1">
                                    {activeLot.installments}x {formatCurrency(bidConfirmation.installmentValue)}
                                </div>
                                <div className="text-sm text-gray-400 mb-6">
                                    Valor Total: {formatCurrency(bidConfirmation.amount)}
                                </div>
                                
                                <div className="space-y-3">
                                    <button 
                                        onClick={confirmBid}
                                        className="w-full bg-green-600 text-white py-3 rounded font-bold uppercase tracking-widest hover:bg-green-500 shadow-lg transition-transform hover:scale-105"
                                    >
                                        Confirmar Lance
                                    </button>
                                    <button 
                                        onClick={() => setBidConfirmation(null)}
                                        className="w-full text-gray-500 py-2 text-xs font-bold uppercase hover:text-gray-800"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
      );
  }

  // HOME VIEW
  return (
    <div className="min-h-screen bg-gray-100">
      {renderHeader()}
      
      {/* Hero */}
      <div className="bg-equus-navy text-white py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
              <img src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2069&auto=format&fit=crop" className="w-full h-full object-cover" />
          </div>
          <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 tracking-tight">Excelência em Cada Lance</h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 font-light">
                  A plataforma mais segura e tecnológica para leilões de cavalos de esporte do Brasil.
              </p>
              <div className="flex justify-center gap-4">
                  <button className="bg-equus-gold text-equus-navy px-8 py-3 rounded font-bold uppercase tracking-widest hover:bg-white transition-colors">
                      Ver Agenda de Leilões
                  </button>
                  <button onClick={() => setCurrentView('SELLER')} className="border border-white text-white px-8 py-3 rounded font-bold uppercase tracking-widest hover:bg-white hover:text-equus-navy transition-colors">
                      Vender Cavalo
                  </button>
              </div>
          </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12 space-y-12">
          
          {/* Events Section - NOW THE MAIN INTERACTION POINT */}
          <section>
              <h2 className="text-2xl font-serif font-bold text-equus-navy mb-6 flex items-center gap-2">
                  <span className="w-2 h-8 bg-equus-gold block"></span>
                  Leilões Disponíveis
              </h2>
              {loading ? (
                   <div className="text-center py-12">
                       <p className="text-gray-500">Carregando leilões em tempo real...</p>
                   </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {events.map(evt => (
                          <div key={evt.id} 
                               className="bg-white rounded shadow-sm overflow-hidden flex flex-col h-full group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200"
                               onClick={() => navigateToEvent(evt.id)}
                          >
                              <div className="relative w-full h-64 overflow-hidden">
                                  <img src={evt.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                  <div className="absolute top-0 right-0 bg-equus-gold text-equus-navy font-bold uppercase text-xs px-3 py-1">
                                      {evt.status === 'ACTIVE' ? 'Aberto para Lances' : 'Em Breve'}
                                  </div>
                              </div>
                              <div className="p-8 flex flex-col justify-center flex-1">
                                  <h3 className="text-2xl font-serif font-bold text-equus-navy mb-2 group-hover:text-equus-gold transition-colors">{evt.title}</h3>
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-6 leading-relaxed">{evt.description}</p>
                                  
                                  <div className="mt-auto border-t border-gray-100 pt-4">
                                      <div className="flex items-center gap-3">
                                          <div className="bg-gray-50 border border-gray-200 p-2 rounded text-center min-w-[70px]">
                                              <span className="block text-2xl font-serif font-bold text-equus-navy leading-none">
                                                  {evt.startTime.getDate()}
                                              </span>
                                              <span className="block text-[10px] uppercase font-bold text-gray-500">
                                                  {evt.startTime.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                              </span>
                                          </div>
                                          <div>
                                              <span className="text-xs text-gray-500 uppercase font-bold block flex items-center gap-2 mb-0.5">
                                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                  Início do 1º Lote
                                              </span>
                                              <span className="text-xl font-bold text-equus-navy font-serif">
                                                  {evt.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                              </span>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="mt-4 pt-3 border-t border-gray-50 flex justify-center">
                                      <button className="text-xs font-bold uppercase tracking-widest text-equus-navy group-hover:text-equus-gold transition-colors flex items-center gap-1">
                                          Acessar Leilão →
                                      </button>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </section>

      </main>

      <footer className="bg-equus-navy text-white py-12 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center font-serif font-bold text-gray-500 text-xl">H</div>
                  <div className="flex flex-col">
                      <span className="font-serif font-bold text-lg tracking-widest">HORSE BID MARKET</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">Plataforma Oficial</span>
                  </div>
               </div>
               <div className="flex gap-8 text-xs font-bold uppercase text-gray-400">
                   <a href="#" className="hover:text-white">Termos de Uso</a>
                   <a href="#" className="hover:text-white">Política de Privacidade</a>
                   <a href="#" className="hover:text-white">Suporte</a>
               </div>
               <div className="text-right">
                   <p className="text-xs text-gray-500">© 2025 Horse Bid Market Inc.</p>
                   <p className="text-[10px] text-gray-600 mt-1">Desenvolvido com tecnologia WebSocket & Gemini AI</p>
               </div>
          </div>
      </footer>
    </div>
  );
};

export default App;
