
import React, { useState } from 'react';
import { HorseLot, AuctionStatus } from '../types';
import Countdown from './Countdown';

interface Props {
  lot: HorseLot;
  onClick: (id: string) => void;
  onBuyNow?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent, id: string) => void;
  eventStartTime?: Date;
}

const AuctionCard: React.FC<Props> = ({ lot, onClick, onBuyNow, isFavorite, onToggleFavorite, eventStartTime }) => {
  const [showCopied, setShowCopied] = useState(false);

  const isActive = lot.status === AuctionStatus.ACTIVE;
  const isRepurchase = lot.status === AuctionStatus.REPURCHASE;
  const isSold = lot.status === AuctionStatus.SOLD;
  const isPassed = lot.status === AuctionStatus.PASSED;

  // Lógica de "Ao Vivo": só aparece se o lote estiver ATIVO e faltar menos de 2 minutos
  const isUrgent = isActive && (new Date(lot.endTime).getTime() - new Date().getTime() < 120000) && (new Date(lot.endTime).getTime() > 0);
  
  const installments = lot.installments || 1;
  const installmentValue = lot.currentPrice / installments;

  // Calculo de abertura individualizado: Início do evento + (Lote - 1) * 2 minutos
  const calculateOpeningTime = () => {
    if (!eventStartTime) return null;
    const baseDate = new Date(eventStartTime);
    const offsetMinutes = (lot.lotNumber - 1) * 2;
    return new Date(baseDate.getTime() + offsetMinutes * 60 * 1000);
  };

  const openingTime = calculateOpeningTime();

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/lote/${lot.id}`).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  let borderClass = 'border-gray-200 hover:border-equus-gold';
  let priceColorClass = 'text-equus-gold';
  let labelText = 'Lance Atual';

  if (isUrgent) borderClass = 'border-red-500 ring-1 ring-red-500 shadow-md';
  else if (isRepurchase) {
      borderClass = 'border-green-500 ring-2 ring-green-500 shadow-lg';
      priceColorClass = 'text-green-600';
      labelText = 'Repasse Imediato';
  } else if (isSold) {
      borderClass = 'border-gray-300 opacity-90';
      priceColorClass = 'text-gray-600';
      labelText = 'Vendido por';
  } else if (isPassed) {
      borderClass = 'border-gray-300 opacity-70';
      priceColorClass = 'text-gray-400';
      labelText = 'Último Lance';
  }

  // Só mostra a barra de abertura se o lote não estiver em status final (Vendido, Repasse ou Não Vendido)
  const showHeaderBar = openingTime && !(isSold || isRepurchase || isPassed);

  return (
    <div className={`bg-white group cursor-pointer border transition-all duration-300 shadow-sm hover:shadow-xl hover:scale-[1.02] overflow-hidden flex flex-col ${borderClass}`} onClick={() => onClick(lot.id)}>
      {/* Barra de Abertura individualizada */}
      {showHeaderBar && (
        <div className="bg-equus-navy border-b-2 border-equus-gold px-4 py-2 flex justify-between items-center shadow-inner">
            <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" className="text-equus-gold" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">Entra em leilão às :</span>
            </div>
            <span className="text-[11px] font-serif font-bold text-equus-gold tracking-widest">
                {openingTime.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}h
            </span>
        </div>
      )}

      <div className="relative h-56 overflow-hidden bg-equus-navy">
        <img src={lot.imageUrl} alt={lot.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90" />
        
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-2">
            <button onClick={(e) => onToggleFavorite?.(e, lot.id)} className={`p-2 rounded-full ${isFavorite ? 'bg-red-500 text-white shadow-xl' : 'bg-black/20 text-white hover:bg-black/40'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
            <button onClick={handleShare} className="p-2 rounded-full bg-black/20 text-white hover:bg-black/40 relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                {showCopied && <span className="absolute right-full mr-2 top-0 bg-equus-navy text-equus-gold text-[8px] font-bold uppercase p-1 rounded whitespace-nowrap">Link Copiado!</span>}
            </button>
        </div>

        <div className="absolute top-0 left-0 bg-equus-navy text-white px-3 py-1 text-[9px] font-serif uppercase tracking-wider z-10">Lote {lot.lotNumber}</div>
        
        {isUrgent && <div className="absolute top-0 right-12 bg-red-600 text-white px-3 py-1 text-[8px] font-bold uppercase tracking-widest animate-pulse z-10 shadow-lg">Ao Vivo</div>}
        {isRepurchase && <div className="absolute top-0 right-12 bg-green-600 text-white px-3 py-1 text-[8px] font-bold uppercase tracking-widest z-10 animate-bounce mt-2 shadow-lg">Compre Já</div>}
        {isSold && <div className="absolute top-0 right-12 bg-gray-800 text-white px-3 py-1 text-[8px] font-bold uppercase tracking-widest z-10 shadow-lg">Vendido</div>}
        {isPassed && <div className="absolute top-0 right-12 bg-red-900 text-white px-3 py-1 text-[8px] font-bold uppercase tracking-widest z-10 shadow-lg">Não Vendido</div>}

        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4">
            <p className="text-[8px] uppercase opacity-75 font-bold tracking-widest text-white mb-1">{lot.breed} • {lot.gender} • {lot.height}m</p>
            <h3 className="text-xl font-serif font-bold leading-tight text-white mb-1">{lot.name}</h3>
            <div className="flex gap-2 text-[9px] text-equus-gold font-bold uppercase tracking-tighter italic">
                <span>{lot.sire}</span>
                <span className="opacity-50">x</span>
                <span>{lot.damSire}</span>
            </div>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
             <p className="text-[10px] text-gray-500 italic leading-tight line-clamp-2">
                "{lot.description}"
             </p>
        </div>

        <div className="mt-4">
            <div className="flex justify-between items-end mb-1">
                <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">{labelText}</div>
                <div className={`text-xl font-bold ${priceColorClass}`}>{installments}x {installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-50">
                {isRepurchase ? (
                    <div className="bg-gray-50 border border-green-100 p-2 rounded-sm text-center">
                        <Countdown endTime={lot.endTime} compact={true} finishedText="Encerrado" />
                        <span className="text-[8px] font-bold text-green-600 uppercase tracking-widest block mt-1">Oferta de Repasse Ativa</span>
                    </div>
                ) : isSold ? (
                    <div className="bg-gray-800 text-white text-center py-2 rounded-sm text-[9px] uppercase font-bold tracking-widest italic">Lote Arrematado</div>
                ) : isPassed ? (
                    <div className="bg-red-900 text-white text-center py-2 rounded-sm text-[9px] uppercase font-bold tracking-widest italic">Lote Não Vendido</div>
                ) : (
                    <div className={`bg-gray-50 border border-gray-100 p-2 rounded-sm text-center ${isUrgent ? 'animate-bounce-subtle shadow-md border-red-100' : ''}`}>
                        <Countdown endTime={lot.endTime} compact={true} finishedText={null} />
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionCard;
