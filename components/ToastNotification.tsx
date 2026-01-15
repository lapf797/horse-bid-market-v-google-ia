
import React, { useEffect, useState } from 'react';

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  imageUrl?: string;
}

interface Props {
  toast: Toast;
  onClose: () => void;
}

const ToastNotification: React.FC<Props> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const DURATION = 6000; // 6 segundos de exibição automática

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, DURATION);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500); 
  };

  const typeStyles = {
    info: 'border-equus-gold bg-white shadow-[0_10px_40px_-10px_rgba(197,160,89,0.3)]',
    warning: 'border-orange-500 bg-white shadow-[0_10px_40px_-10px_rgba(249,115,22,0.3)]',
    success: 'border-emerald-500 bg-white shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)]'
  };

  const isUrgentSell = toast.title.includes("VAI VENDER");
  const isEnteringAuction = toast.title.includes("ENTROU EM LEILÃO");

  return (
    <div 
      className={`pointer-events-auto w-80 md:w-96 p-4 border-l-4 rounded shadow-2xl transition-all duration-500 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${typeStyles[toast.type]} ${isUrgentSell ? 'animate-pulse border-red-500 ring-2 ring-red-500/20' : ''} ${isEnteringAuction ? 'border-equus-navy ring-2 ring-equus-gold/20' : ''}`}
    >
      <div className="flex gap-4">
        {toast.imageUrl && (
          <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 border border-gray-100 shadow-inner">
            <img src={toast.imageUrl} alt="Lote" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isUrgentSell ? 'text-red-600' : (isEnteringAuction ? 'text-equus-navy' : 'text-equus-gold')}`}>
              {toast.title}
            </h4>
            <button onClick={handleClose} className="text-gray-300 hover:text-gray-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
            </button>
          </div>
          <p className="text-[11px] text-gray-500 leading-tight font-medium pr-2">{toast.message}</p>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 h-1 bg-gray-50 w-full rounded-b overflow-hidden">
          <div 
            className={`h-full transition-all linear ${isUrgentSell ? 'bg-red-500' : (isEnteringAuction ? 'bg-equus-navy' : 'bg-equus-gold')}`}
            style={{ 
              width: isVisible ? '0%' : '100%', 
              transitionDuration: isVisible ? `${DURATION}ms` : '0ms' 
            }}>
          </div>
      </div>
    </div>
  );
};

export default ToastNotification;
