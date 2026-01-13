
import React, { useState, useEffect } from 'react';
import { AuctionEvent, HorseLot, SellerSubmission, Bid, AuctionStatus } from './types';
import { MOCK_EVENTS, MOCK_LOTS, MOCK_SUBMISSIONS } from './services/mockData';
import { supabase, fetchActiveEvents, fetchLotsByEvent, placeRealBid, isSupabaseConfigured } from './services/supabase';

import AuctionCard from './components/AuctionCard';
import GeminiConsultant from './components/GeminiConsultant';
import Countdown from './components/Countdown';
import SellerRegistration from './components/SellerRegistration';
import AdminDashboard from './components/AdminDashboard';
import UserRegistration from './components/UserRegistration';
import Login from './components/Login';

const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatTime = (date: Date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'HOME' | 'EVENT' | 'DETAIL' | 'SELLER' | 'REGISTER' | 'LOGIN' | 'ADMIN'>('HOME');
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [bidConfirmation, setBidConfirmation] = useState<{isOpen: boolean, amount: number, installmentValue: number} | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'PHOTOS' | 'VIDEO'>('PHOTOS');
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  const [officialTime, setOfficialTime] = useState(new Date());

  const [events, setEvents] = useState<AuctionEvent[]>([]);
  const [lots, setLots] = useState<HorseLot[]>([]);
  const [submissions, setSubmissions] = useState<SellerSubmission[]>([]);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, type: 'USER' | 'ADMIN'} | null>(null);
  const [loading, setLoading] = useState(true);

  const activeLot = lots.find(l => l.id === selectedLotId);
  const activeEvent = events.find(e => e.id === selectedEventId);

  useEffect(() => {
    const init = async () => {
        setIsLive(isSupabaseConfigured);

        if (isSupabaseConfigured) {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setCurrentUser({ id: session.user.id, name: session.user.email || 'Usuário', type: 'USER' });
                }

                const dbEvents = await fetchActiveEvents();
                if (dbEvents && dbEvents.length > 0) {
                     setEvents(dbEvents.map((e: any) => ({
                         id: e.id,
                         title: e.title,
                         description: e.description,
                         coverImage: e.cover_image,
                         startTime: new Date(e.start_time),
                         endTime: new Date(e.end_time),
                         status: e.status
                     })));
                } else {
                    setEvents(MOCK_EVENTS);
                }
            } catch (e) {
                console.error("Failed to initialize Supabase:", e);
                setEvents(MOCK_EVENTS);
            }
        } else {
            setEvents(MOCK_EVENTS);
        }
        setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
      if (selectedEventId) {
          if (isLive) {
              const loadLots = async () => {
                  try {
                      const dbLots = await fetchLotsByEvent(selectedEventId);
                      if (dbLots && dbLots.length > 0) {
                          setLots(dbLots.map((l: any) => ({
                              ...l,
                              endTime: new Date(l.end_time),
                              bids: l.bids?.map((b: any) => ({
                                  id: b.id,
                                  amount: b.amount,
                                  timestamp: new Date(b.created_at),
                                  bidderName: b.user_id === currentUser?.id ? 'Você' : 'Usuário ***'
                              })).sort((a: any, b: any) => b.amount - a.amount) || []
                          })));
                      } else {
                          setLots(MOCK_LOTS.filter(l => l.auctionId === selectedEventId));
                      }
                  } catch (e) { 
                      console.error(e); 
                      setLots(MOCK_LOTS.filter(l => l.auctionId === selectedEventId));
                  }
              };
              loadLots();
          } else {
              setLots(MOCK_LOTS.filter(l => l.auctionId === selectedEventId));
          }
      }
  }, [selectedEventId, isLive, currentUser]);

  useEffect(() => {
    const timer = setInterval(() => setOfficialTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const requestBid = (amount: number) => {
    if (!activeLot) return;
    if (!currentUser) { setCurrentView('LOGIN'); return; }
    setBidConfirmation({ isOpen: true, amount, installmentValue: amount / (activeLot.installments || 1) });
  };

  const confirmBid = async () => {
    if (!activeLot || !bidConfirmation || !currentUser) return;
    if (!isLive) {
        alert("Lances reais exigem conexão com o Supabase. Por favor, configure as variáveis de ambiente.");
        return;
    }
    try {
        await placeRealBid(activeLot.id, bidConfirmation.amount, currentUser.id);
        setBidConfirmation(null);
    } catch (e) {
        alert("Erro ao enviar lance.");
    }
  };

  const renderHeader = () => (
      <header className="bg-equus-navy text-white shadow-md sticky top-0 z-50 border-b border-equus-gold/30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center h-20">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('HOME')}>
                  <div className="w-10 h-10 border-2 border-equus-gold rounded-sm flex items-center justify-center font-serif font-bold text-equus-gold text-xl shadow-[0_0_15px_rgba(197,160,89,0.3)]">H</div>
                  <div className="flex flex-col">
                    <span className="font-serif font-bold text-lg tracking-widest leading-none">HORSE BID</span>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Market</span>
                  </div>
              </div>

              <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">{isLive ? 'Sistema Live' : 'Demonstração'}</span>
                        </div>
                        <div className="text-xl font-mono font-bold text-equus-gold">
                            {officialTime.toLocaleTimeString('pt-BR', { hour12: false })}
                        </div>
                  </div>
              </div>

              <nav className="hidden md:flex items-center gap-6">
                  <button onClick={() => setCurrentView('HOME')} className="text-xs font-bold uppercase hover:text-equus-gold transition-colors">Leilões</button>
                  <button onClick={() => setCurrentView('SELLER')} className="text-xs font-bold uppercase hover:text-equus-gold transition-colors">Vender</button>
                  {currentUser ? (
                      <div className="flex items-center gap-3 ml-4">
                          <span className="text-xs text-gray-300"><strong>{currentUser.name}</strong></span>
                          <button onClick={async () => { if(isLive) await supabase.auth.signOut(); setCurrentUser(null); }} className="text-[10px] uppercase font-bold text-red-400 border border-red-400/50 px-2 py-1 rounded">Sair</button>
                      </div>
                  ) : (
                      <div className="flex gap-4 ml-4">
                        <button onClick={() => setCurrentView('LOGIN')} className="text-white hover:text-equus-gold font-bold text-xs uppercase transition-colors">Entrar</button>
                        <button onClick={() => setCurrentView('REGISTER')} className="bg-equus-gold text-equus-navy px-5 py-2 rounded font-bold text-xs uppercase hover:bg-white transition-all shadow-lg">Cadastre-se</button>
                      </div>
                  )}
              </nav>
          </div>
      </header>
  );

  if (loading) return <div className="h-screen bg-equus-navy flex items-center justify-center text-equus-gold font-serif animate-pulse">Sincronizando Mercado...</div>;
  if (currentView === 'ADMIN') return <AdminDashboard events={events} submissions={submissions} onCreateEvent={(e) => setEvents([...events, e])} onApproveSubmission={() => {}} onRejectSubmission={() => {}} onNavigateHome={() => setCurrentView('HOME')} />;
  if (currentView === 'SELLER') return <>{renderHeader()}<SellerRegistration onCancel={() => setCurrentView('HOME')} onSubmit={() => setCurrentView('HOME')} /></>;
  if (currentView === 'LOGIN') return <Login onCancel={() => setCurrentView('HOME')} onSuccess={(u) => { setCurrentUser({id: u.id, name: u.name, type: 'USER'}); setCurrentView('HOME'); }} onRegisterClick={() => setCurrentView('REGISTER')} />;
  if (currentView === 'REGISTER') return <UserRegistration onCancel={() => setCurrentView('HOME')} onSuccess={() => setCurrentView('LOGIN')} />;

  if (currentView === 'EVENT' && activeEvent) {
    const eventLots = lots.filter(l => l.auctionId === activeEvent.id);
    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {renderHeader()}
            <div className="relative bg-equus-navy text-white py-12 mb-8 border-b-4 border-equus-gold">
                  <div className="absolute inset-0 opacity-20"><img src={activeEvent.coverImage} className="w-full h-full object-cover" /></div>
                  <div className="max-w-7xl mx-auto px-4 relative z-10">
                      <button onClick={() => setCurrentView('HOME')} className="mb-4 text-xs font-bold uppercase text-gray-400 hover:text-white">← Ver Outros Eventos</button>
                      <h1 className="text-4xl font-serif font-bold mb-2">{activeEvent.title}</h1>
                      <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
                        <div className="bg-equus-gold/20 text-equus-gold px-3 py-1 rounded border border-equus-gold/30">Início: {formatDate(activeEvent.startTime)} às {formatTime(activeEvent.startTime)}</div>
                      </div>
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
        <div className="min-h-screen bg-gray-50 pb-12">
            {renderHeader()}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded shadow-sm overflow-hidden border">
                            <div className="aspect-video bg-black relative">
                                <img src={selectedGalleryImage || activeLot.imageUrl} className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded shadow-sm border">
                            <h3 className="font-serif font-bold text-xl mb-4 uppercase tracking-widest border-b pb-2">Detalhes do Lote {activeLot.lotNumber}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                <div className="p-3 bg-gray-50 rounded"><span className="text-[10px] block text-gray-400 uppercase">Pai</span><span className="font-bold">{activeLot.sire}</span></div>
                                <div className="p-3 bg-gray-50 rounded"><span className="text-[10px] block text-gray-400 uppercase">Mãe</span><span className="font-bold">{activeLot.dam}</span></div>
                                <div className="p-3 bg-gray-50 rounded"><span className="text-[10px] block text-gray-400 uppercase">Avô Materno</span><span className="font-bold">{activeLot.damSire}</span></div>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{activeLot.description}</p>
                        </div>
                        <GeminiConsultant horse={activeLot} />
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded shadow-xl border-t-4 border-equus-gold sticky top-24">
                            <h2 className="text-2xl font-serif font-bold text-equus-navy mb-4">{activeLot.name}</h2>
                            <div className="mb-6 p-4 bg-gray-50 rounded text-center border">
                                <Countdown endTime={activeLot.endTime} />
                            </div>
                            <div className="mb-6 space-y-4">
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
                                className={`w-full py-4 rounded font-bold uppercase tracking-widest shadow-lg transition-all ${userIsWinning ? 'bg-green-600 text-white' : 'bg-equus-gold text-white hover:bg-equus-navy'}`}
                            >
                                {userIsWinning ? 'Liderando o Lote' : `Dar Lance (${activeLot.installments}x ${formatCurrency(nextBid / activeLot.installments)})`}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {bidConfirmation && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded shadow-2xl max-w-sm w-full p-8 border-t-8 border-equus-gold text-center">
                        <h3 className="font-serif font-bold text-xl mb-4">CONFIRMAR LANCE REAL</h3>
                        <p className="text-sm text-gray-600 mb-6">Você está prestes a enviar um lance vinculante no valor de <strong>{activeLot.installments}x {formatCurrency(bidConfirmation.installmentValue)}</strong>.</p>
                        <button onClick={confirmBid} className="w-full bg-green-600 text-white py-3 rounded font-bold uppercase mb-3 hover:bg-green-700 transition-colors">Confirmar Agora</button>
                        <button onClick={() => setBidConfirmation(null)} className="text-xs uppercase text-gray-400 font-bold hover:text-red-500">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      <div className="bg-equus-navy text-white py-20 relative overflow-hidden border-b-8 border-equus-gold">
          <div className="absolute inset-0 opacity-30"><img src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2069" className="w-full h-full object-cover" /></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
              <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 drop-shadow-lg">Horse Bid Live</h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 font-light tracking-wide">A primeira plataforma de leilões 100% automatizada com auditoria de IA.</p>
              <div className="flex justify-center gap-6">
                  <button className="bg-equus-gold text-equus-navy px-10 py-4 rounded font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(197,160,89,0.5)]">Explorar Lotes</button>
                  <button onClick={() => setCurrentView('SELLER')} className="border-2 border-white text-white px-10 py-4 rounded font-bold uppercase tracking-widest hover:bg-white hover:text-equus-navy transition-all">Quero Vender</button>
              </div>
          </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-equus-navy border-l-8 border-equus-gold pl-6 uppercase tracking-wider">Leilões em Andamento</h2>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Atualizado agora</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {events.length > 0 ? events.map(evt => (
                  <div key={evt.id} className="bg-white rounded-sm shadow-xl overflow-hidden group cursor-pointer border hover:border-equus-gold transition-all" onClick={() => { setSelectedEventId(evt.id); setCurrentView('EVENT'); }}>
                      <div className="h-80 overflow-hidden relative">
                          <img src={evt.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                          <div className="absolute inset-0 bg-gradient-to-t from-equus-navy to-transparent opacity-60"></div>
                          <div className="absolute bottom-6 left-6 text-white">
                                <span className="bg-equus-gold text-equus-navy px-4 py-1 text-xs font-bold uppercase rounded-sm mb-3 inline-block tracking-widest">Catálogo Live</span>
                                <h3 className="text-3xl font-serif font-bold">{evt.title}</h3>
                          </div>
                      </div>
                      <div className="p-10 border-t border-gray-100">
                          <p className="text-gray-600 mb-8 font-light italic text-lg leading-relaxed">"{evt.description}"</p>
                          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                              <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Início da Batida</span>
                                  <span className="text-equus-navy font-bold font-mono">{formatDate(evt.startTime)} às {formatTime(evt.startTime)}</span>
                              </div>
                              <span className="text-equus-gold font-bold text-2xl group-hover:translate-x-2 transition-transform">→</span>
                          </div>
                      </div>
                  </div>
              )) : (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-300 rounded text-gray-400 uppercase font-bold tracking-widest">Nenhum leilão disponível no momento.</div>
              )}
          </div>
      </main>
    </div>
  );
};

export default App;
