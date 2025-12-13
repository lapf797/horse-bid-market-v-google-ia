
import React from 'react';
import { HorseLot, AuctionStatus } from '../types';
import Countdown from './Countdown';

interface Props {
  lot: HorseLot;
  onClick: (id: string) => void;
  onBuyNow?: () => void;
}

const AuctionCard: React.FC<Props> = ({ lot, onClick, onBuyNow }) => {
  // Status Helpers
  const isActive = lot.status === AuctionStatus.ACTIVE;
  const isRepurchase = lot.status === AuctionStatus.REPURCHASE;
  const isSold = lot.status === AuctionStatus.SOLD;
  const isPassed = lot.status === AuctionStatus.PASSED;

  // Check if "In Auction" (less than 2 mins)
  const isUrgent = isActive && (new Date(lot.endTime).getTime() - new Date().getTime() < 120000) && (new Date(lot.endTime).getTime() > 0);
  
  // Auction Entry Time Logic (2 mins before end)
  const entryTime = new Date(lot.endTime.getTime() - 2 * 60 * 1000);
  const showEntryTime = isActive && new Date().getTime() < entryTime.getTime();

  // Winning Bidder
  const winningBidder = lot.bids.length > 0 ? lot.bids[0].bidderName : null;

  // Installment Logic
  const installments = lot.installments || 1;
  const installmentValue = lot.currentPrice / installments;

  // Dynamic Styles
  let borderClass = 'border-gray-200 hover:border-equus-gold';
  let priceColorClass = 'text-equus-gold';
  let labelText = 'Lance Atual';

  if (isUrgent) {
      borderClass = 'border-red-500 ring-1 ring-red-500 shadow-md';
  } else if (isRepurchase) {
      borderClass = 'border-green-500 ring-2 ring-green-500 shadow-lg';
      priceColorClass = 'text-green-600';
      labelText = 'Valor de Repasse';
  } else if (isSold) {
      borderClass = 'border-gray-300 opacity-90 grayscale-[0.3]';
      priceColorClass = 'text-gray-600';
      labelText = 'Vendido por';
  } else if (isPassed) {
      labelText = 'Status';
  }

  return (
    <div 
      className={`bg-white group cursor-pointer border transition-all duration-300 shadow-sm hover:shadow-xl hover:scale-[1.02] overflow-hidden flex flex-col ${borderClass}`}
      onClick={() => onClick(lot.id)}
    >
      {/* Image Container: Taller on desktop, optimized height on mobile */}
      <div className="relative h-56 md:h-64 overflow-hidden">
        <img 
          src={lot.imageUrl} 
          alt={lot.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-0 left-0 bg-equus-navy text-white px-3 py-1 text-xs font-serif uppercase tracking-wider z-10">
          Lote {lot.lotNumber}
        </div>
        
        {/* Status Overlays */}
        {isUrgent && (
            <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider animate-pulse z-10">
                Ao Vivo
            </div>
        )}
        {isRepurchase && (
            <div className="absolute top-0 right-0 bg-green-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider animate-pulse shadow-sm z-10">
                Oportunidade
            </div>
        )}
        {isSold && (
            <div className="absolute top-0 right-0 bg-gray-800 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider z-10">
                Vendido
            </div>
        )}

        {/* Text Overlay on Image */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 md:p-4 pt-12">
             <div className="text-white">
                <p className="text-[10px] md:text-xs uppercase opacity-90 font-bold tracking-wider mb-1">{lot.breed} • {lot.gender}</p>
                <h3 className="text-lg md:text-xl font-serif font-bold leading-tight shadow-black drop-shadow-md">{lot.name}</h3>
             </div>
        </div>
      </div>
      
      {/* Content Body */}
      <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
        
        {/* Pedigree Info - Compact on mobile */}
        <div className="space-y-1 md:space-y-2 mb-3">
             <div className="flex justify-between text-xs md:text-sm border-b border-gray-100 pb-1 md:pb-2">
                <span className="text-gray-500">Pai:</span>
                <span className="font-semibold text-equus-navy truncate ml-2">{lot.sire}</span>
             </div>
             <div className="flex justify-between text-xs md:text-sm border-b border-gray-100 pb-1 md:pb-2">
                <span className="text-gray-500">Avô Materno:</span>
                <span className="font-semibold text-equus-navy truncate ml-2">{lot.damSire}</span>
             </div>
        </div>

        {/* Short Description Hook */}
        <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed font-light">
                {lot.description}
            </p>
        </div>

        <div>
            {/* Entry Time Info (Active only) */}
            {showEntryTime && (
                <div className="bg-equus-green/10 text-center mb-2 rounded py-1 border border-equus-green/20">
                    <span className="text-[10px] uppercase text-gray-600 font-bold block">Entra em leilão às</span>
                    <span className="text-xs font-bold text-equus-navy">
                        {entryTime.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute:'2-digit' })}
                    </span>
                </div>
            )}

            <div className="flex justify-between items-end mb-1">
                <div className="text-xs text-gray-500 uppercase font-semibold">{labelText}</div>
                <div className={`text-xl md:text-2xl font-bold ${priceColorClass}`}>
                    {installments}x {installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
            </div>

            {/* Winner Display (Active/Sold) */}
            <div className="flex justify-end mb-2 h-4">
                {(isActive || isSold) && winningBidder && (
                    <div className="text-[10px] text-gray-500 font-medium truncate max-w-full">
                        {isSold ? 'Comprador:' : 'Vencendo:'} <span className="text-equus-navy font-bold">{winningBidder}</span>
                    </div>
                )}
            </div>
            
            {/* Footer Action Area */}
            {isRepurchase ? (
                <button 
                    onClick={(e) => { e.stopPropagation(); onBuyNow?.(); }}
                    className="w-full bg-green-600 text-white text-center py-3 rounded shadow-md uppercase text-sm font-bold tracking-widest animate-pulse hover:bg-green-500 transition-colors touch-manipulation">
                    Compre Já
                </button>
            ) : isSold ? (
                <div className="bg-gray-200 text-gray-500 text-center py-2 rounded text-xs uppercase font-bold tracking-widest border border-gray-300">
                    Lote Arrematado
                </div>
            ) : isPassed ? (
                <div className="bg-gray-100 text-gray-400 text-center py-2 rounded text-xs uppercase font-bold tracking-widest">
                    Não Vendido
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-100 p-2 rounded text-center">
                    <Countdown endTime={lot.endTime} compact={true} finishedText={null} />
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default AuctionCard;
