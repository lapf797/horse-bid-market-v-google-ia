
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

const formatDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'HOME' | 'EVENT' | 'DETAIL' | 'SELLER' | 'REGISTER' | 'LOGIN' | 'ADMIN'>('HOME');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bidConfirmation, setBidConfirmation] = useState<{isOpen: boolean, amount: number, installmentValue: number} | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'PHOTOS' | 'VIDEO'>('PHOTOS');
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  
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
                          bids: l.bids?.map((b: any) => ({
                              id: b.id || 'temp',
                              amount: b.amount,
                              timestamp: new Date(b.created_at),
                              bidderName: b.user_id === currentUser?.id ? 'Você' : 'Usuário ***'
                          })).sort((a: any, b: any) => b.amount - a.amount) || [],
                          dob: l.dob || '2020-01-01',
                          gender: l.gender || 'Stallion',
                          sire: l.sire || 'N/A',
                          dam: l.dam || 'N/A',
                          damSire: l.dam_sire || 'N/A',
                          discipline: l.discipline || 'Salto',
                          height: l.height || '1.70m',
                          galleryImages: l.gallery_images || [l.image_url],
                          youtubeId: l.youtube_id,
                          sellerNotes: l.seller_notes,
                          documents: l.documents || []
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
    if (activeLot) {
        setSelectedGalleryImage(activeLot.imageUrl);
        setActiveMediaTab('PHOTOS');
    }
  }, [selectedLotId]);

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
                      Modo Demonstração
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
                      <div className="flex flex-col sm:flex-row gap-4 text-xs font-bold uppercase tracking-widest mb-4">
                        <div className="bg-equus-gold/20 text-equus-gold px-3 py-1 rounded border border-equus-gold/30">
                            DATA DO LEILÃO : {formatDate(activeEvent.startTime)}
                        </div>
                        <div className="bg-equus-gold/20 text-equus-gold px-3 py-1 rounded border border-equus-gold/30">
                            HORARIO DO PRIMEIRO LOTE : {formatTime(activeEvent.startTime)}
                        </div>
                      </div>
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
                        
                        {/* Media Tabs and Display */}
                        <div className="bg-white rounded-sm shadow-sm overflow-hidden border border-gray-200">
                            <div className="flex border-b border-gray-100">
                                <button 
                                    onClick={() => setActiveMediaTab('PHOTOS')}
                                    className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeMediaTab === 'PHOTOS' ? 'bg-equus-gold text-white' : 'bg-white text-gray-400 hover:text-equus-navy'}`}
                                >
                                    Fotos
                                </button>
                                {activeLot.youtubeId && (
                                    <button 
                                        onClick={() => setActiveMediaTab('VIDEO')}
                                        className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeMediaTab === 'VIDEO' ? 'bg-equus-gold text-white' : 'bg-white text-gray-400 hover:text-equus-navy'}`}
                                    >
                                        Vídeo
                                    </button>
                                )}
                            </div>

                            <div className="aspect-video bg-black relative flex flex-col">
                                {activeMediaTab === 'PHOTOS' ? (
                                    <>
                                        <img 
                                            src={selectedGalleryImage || activeLot.imageUrl} 
                                            className="flex-1 w-full h-full object-contain" 
                                            alt={activeLot.name} 
                                        />
                                        {activeLot.galleryImages && activeLot.galleryImages.length > 1 && (
                                            <div className="bg-black/80 p-2 flex gap-2 overflow-x-auto custom-scrollbar border-t border-white/10">
                                                {activeLot.galleryImages.map((img, idx) => (
                                                    <img 
                                                        key={idx} 
                                                        src={img} 
                                                        onClick={() => setSelectedGalleryImage(img)}
                                                        className={`h-16 w-24 object-cover cursor-pointer rounded-sm border-2 transition-all ${selectedGalleryImage === img ? 'border-equus-gold scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <iframe
                                        className="w-full h-full"
                                        src={`https://www.youtube.com/embed/${activeLot.youtubeId}?autoplay=1&rel=0`}
                                        title={activeLot.name}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                )}
                            </div>
                        </div>

                        {/* Description & Technical Sheet */}
                        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <h3 className="font-serif font-bold text-equus-navy text-xl uppercase tracking-widest">Ficha do Lote</h3>
                                <div className="text-right">
                                    <span className="block text-[10px] text-gray-400 uppercase font-bold">Lote Nº</span>
                                    <span className="text-xl font-serif font-bold text-equus-gold">{activeLot.lotNumber}</span>
                                </div>
                            </div>

                            {/* Genealogia Restaurada */}
                            <div className="mb-8">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Genealogia (Pedigree)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                                    <div className="bg-equus-navy p-4 text-white rounded-l flex flex-col justify-center border-r border-white/10">
                                        <span className="text-[9px] uppercase opacity-60 mb-1">Pai (Sire)</span>
                                        <span className="font-bold tracking-wider">{activeLot.sire}</span>
                                    </div>
                                    <div className="bg-equus-navy p-4 text-white flex flex-col justify-center border-r border-white/10">
                                        <span className="text-[9px] uppercase opacity-60 mb-1">Mãe (Dam)</span>
                                        <span className="font-bold tracking-wider">{activeLot.dam}</span>
                                    </div>
                                    <div className="bg-equus-navy p-4 text-white rounded-r flex flex-col justify-center">
                                        <span className="text-[9px] uppercase opacity-60 mb-1">Avô Materno</span>
                                        <span className="font-bold tracking-wider">{activeLot.damSire}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Informações Técnicas</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-3 bg-gray-50 rounded">
                                        <span className="block text-[10px] text-gray-400 uppercase">Raça</span>
                                        <span className="font-bold text-equus-navy text-sm">{activeLot.breed}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded">
                                        <span className="block text-[10px] text-gray-400 uppercase">Sexo</span>
                                        <span className="font-bold text-equus-navy text-sm">{activeLot.gender === 'Mare' ? 'Fêmea' : activeLot.gender === 'Stallion' ? 'Macho' : 'Castrado'}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded">
                                        <span className="block text-[10px] text-gray-400 uppercase">Nascimento</span>
                                        <span className="font-bold text-equus-navy text-sm">{new Date(activeLot.dob).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded">
                                        <span className="block text-[10px] text-gray-400 uppercase">Altura</span>
                                        <span className="font-bold text-equus-navy text-sm">{activeLot.height}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Descrição Comercial</h4>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">{activeLot.description}</p>
                            </div>

                            {/* Notas do Vendedor Restauradas */}
                            {activeLot.sellerNotes && (
                                <div className="mb-8 p-5 bg-equus-gold/5 border-l-4 border-equus-gold rounded-r">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-equus-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" fillRule="evenodd" clipRule="evenodd"></path></svg>
                                        <h4 className="text-[10px] font-bold text-equus-gold uppercase tracking-widest">Notas do Vendedor</h4>
                                    </div>
                                    <p className="text-gray-600 italic text-sm">"{activeLot.sellerNotes}"</p>
                                </div>
                            )}

                            {activeLot.documents && activeLot.documents.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Documentação</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {activeLot.documents.map((doc, idx) => (
                                            <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border border-gray-100 rounded hover:border-equus-gold hover:bg-gray-50 transition-all group">
                                                <div className="bg-red-50 p-2 rounded text-red-600">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-6-6H7zm6 7V3.5L18.5 9H13z"/></svg>
                                                </div>
                                                <span className="text-xs font-bold text-gray-700">{doc.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <GeminiConsultant horse={activeLot} />
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-sm shadow-xl border-t-4 border-equus-gold sticky top-24">
                            <h2 className="text-2xl font-serif font-bold text-equus-navy mb-4">{activeLot.name}</h2>
                            <div className="mb-6 p-4 bg-gray-50 rounded text-center">
                                <Countdown endTime={activeLot.endTime} />
                            </div>
                            
                            <div className="mb-6 space-y-4 border-b border-gray-100 pb-6">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Lance Atual</span>
                                        <div className="text-3xl font-bold text-equus-navy">{activeLot.installments}x {formatCurrency(activeLot.currentPrice / activeLot.installments)}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">À vista</span>
                                        <div className="text-sm font-bold text-gray-600">{formatCurrency(activeLot.currentPrice)}</div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => requestBid(nextBid)} 
                                disabled={userIsWinning} 
                                className={`w-full py-4 rounded font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 ${userIsWinning ? 'bg-green-600 text-white cursor-default' : 'bg-equus-gold text-white hover:bg-equus-navy'}`}
                            >
                                {userIsWinning ? 'Você está ganhando!' : `Dar Lance (${activeLot.installments}x ${formatCurrency(nextBid / activeLot.installments)})`}
                            </button>

                            <div className="mt-8">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Histórico de Lances</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                    {activeLot.bids.length > 0 ? (
                                        activeLot.bids.map(bid => (
                                            <div key={bid.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 animate-new-bid">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-equus-navy">{bid.bidderName}</span>
                                                    <span className="text-[10px] text-gray-400">{bid.timestamp.toLocaleTimeString('pt-BR')}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-mono font-bold text-equus-gold">{formatCurrency(bid.amount)}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-300 text-xs italic">Aguardando lance inicial...</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {bidConfirmation && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full overflow-hidden p-8 text-center border-t-8 border-equus-gold animate-fade-in">
                        <h3 className="text-equus-navy font-serif font-bold text-xl uppercase mb-6 tracking-widest">Confirmar Lance</h3>
                        <div className="bg-gray-100 p-4 rounded mb-6">
                            <span className="text-[10px] text-gray-500 uppercase font-bold block mb-2">Valor da Parcela</span>
                            <div className="text-4xl font-bold text-equus-navy mb-1">{activeLot.installments}x {formatCurrency(bidConfirmation.installmentValue)}</div>
                            <span className="text-xs text-gray-500">Valor Total: {formatCurrency(bidConfirmation.amount)}</span>
                        </div>
                        <button onClick={confirmBid} className="w-full bg-green-600 text-white py-4 rounded font-bold uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg mb-3">
                            Confirmar
                        </button>
                        <button onClick={() => setBidConfirmation(null)} className="w-full text-gray-400 py-2 text-xs font-bold uppercase hover:text-red-500 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
      );
  }

  // Home View
  return (
    <div className="min-h-screen bg-gray-100">
      {renderHeader()}
      <div className="bg-equus-navy text-white py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"><img src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2069" className="w-full h-full object-cover" /></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">Excelência em Cada Lance</h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">O mercado premium dos grandes cavalos de esporte.</p>
              <div className="flex justify-center gap-4">
                  <button className="bg-equus-gold text-equus-navy px-8 py-3 rounded font-bold uppercase tracking-widest hover:bg-white transition-all">Ver Agenda</button>
                  <button onClick={() => setCurrentView('SELLER')} className="border border-white text-white px-8 py-3 rounded font-bold uppercase tracking-widest hover:bg-white hover:text-equus-navy transition-all">Vender Cavalo</button>
              </div>
          </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-serif font-bold text-equus-navy mb-8 border-l-4 border-equus-gold pl-3 tracking-widest uppercase">Leilões Ativos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {events.map(evt => (
                  <div key={evt.id} className="bg-white rounded shadow-sm overflow-hidden group cursor-pointer border hover:shadow-2xl transition-all" onClick={() => { setSelectedEventId(evt.id); setCurrentView('EVENT'); }}>
                      <div className="h-72 overflow-hidden relative">
                          <img src={evt.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                          <div className="absolute inset-0 bg-gradient-to-t from-equus-navy/80 to-transparent"></div>
                          <div className="absolute bottom-4 left-4 text-white">
                                <span className="bg-equus-gold text-equus-navy px-3 py-1 text-[10px] font-bold uppercase rounded-sm mb-2 inline-block tracking-widest uppercase">Ao Vivo</span>
                          </div>
                      </div>
                      <div className="p-8">
                          <h3 className="text-2xl font-serif font-bold text-equus-navy mb-4 group-hover:text-equus-gold transition-colors">{evt.title}</h3>
                          
                          {/* Destaque para Data e Horário evidenciados */}
                          <div className="grid grid-cols-1 gap-2 mb-6 py-4 border-y border-gray-100 bg-gray-50/80 px-4 rounded">
                              <div className="flex justify-between items-center">
                                  <span className="text-[11px] text-gray-600 font-extrabold uppercase tracking-widest">DATA DO LEILÃO :</span>
                                  <span className="text-base font-bold text-equus-navy border-b-2 border-equus-gold">{formatDate(evt.startTime)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-[11px] text-gray-600 font-extrabold uppercase tracking-widest">HORARIO DO PRIMEIRO LOTE :</span>
                                  <span className="text-base font-bold text-equus-navy border-b-2 border-equus-gold">{formatTime(evt.startTime)}</span>
                              </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-6 line-clamp-2">{evt.description}</p>
                          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acesse o Catálogo Completo</span>
                              <span className="text-equus-navy font-bold text-xl">→</span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </main>
    </div>
  );
};

export default App;
