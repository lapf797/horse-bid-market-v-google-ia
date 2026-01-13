
import { HorseLot, AuctionEvent, AuctionStatus, SellerSubmission, PaymentConfig } from '../types';

const now = new Date();

const addMinutes = (date: Date, minutes: number) => {
  const newDate = new Date(date);
  newDate.setTime(newDate.getTime() + (minutes * 60 * 1000));
  return newDate;
};

export const DEFAULT_PAYMENT_CONFIGS: PaymentConfig[] = [
    { id: 'p1', name: '30 Parcelas (2+2+2+24)', installments: 30, description: '2 no ato, 2 em 30 dias, 2 em 60 dias e 24 mensais consecutivas.' },
    { id: 'p2', name: '40 Parcelas (1+39)', installments: 40, description: '1 no ato e 39 mensais iguais.' },
    { id: 'p3', name: '50 Parcelas (2+2+46)', installments: 50, description: '2 no ato, 2 em 30 dias e 46 mensais.' },
];

export const MOCK_EVENTS: AuctionEvent[] = [
  {
    id: 'evt1',
    title: "Leilão Elite Potros 2025",
    description: "A melhor seleção da criação nacional com genéticas olímpicas.",
    coverImage: "https://images.unsplash.com/photo-1598556776374-1a9b37d7c624?q=80&w=2070&auto=format&fit=crop",
    startTime: addMinutes(now, -120),
    endTime: addMinutes(now, 120),
    status: AuctionStatus.ACTIVE,
    paymentConfigId: 'p1'
  },
  {
    id: 'evt2',
    title: "Liquidação Total Haras Imperial",
    description: "Oportunidade única de adquirir matrizes e cavalos montados.",
    coverImage: "https://images.unsplash.com/photo-1534008277239-66175e1136b9?q=80&w=2070&auto=format&fit=crop",
    startTime: addMinutes(now, 60 * 24),
    endTime: addMinutes(now, 60 * 48),
    status: AuctionStatus.UPCOMING,
    paymentConfigId: 'p1'
  }
];

export const MOCK_LOTS: HorseLot[] = [
  {
    id: '1',
    auctionId: 'evt1',
    lotNumber: 1,
    name: "Royal Thunder Z",
    breed: "BH (Brasileiro de Hipismo)",
    dob: "2019-04-12",
    gender: "Stallion",
    sire: "Relaxing Bull",
    dam: "Lady Lightning",
    damSire: "Thunder van de Zuuthoeve",
    discipline: "Salto",
    height: "1.72m",
    description: "Um garanhão moderno com escopo ilimitado. Royal Thunder Z combina a força de seu pai com a agilidade necessária para o esporte de alto nível. Vet check limpo e pronto para competir nas classes de 1.20m.",
    imageUrl: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=2071&auto=format&fit=crop",
    startPrice: 45000,
    currentPrice: 62000,
    installments: 30,
    status: AuctionStatus.ACTIVE,
    endTime: addMinutes(now, 5.0),
    bids: [
      { id: 'b1', bidderName: 'Cliente 4492', amount: 45000, timestamp: addMinutes(now, -1200) },
      { id: 'b2', bidderName: 'Cliente 9921', amount: 48000, timestamp: addMinutes(now, -1000) },
      { id: 'b3', bidderName: 'Cliente 3321', amount: 55000, timestamp: addMinutes(now, -300) },
      { id: 'b4', bidderName: 'Cliente 4492', amount: 62000, timestamp: addMinutes(now, -60) },
    ],
    galleryImages: [
        "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?q=80&w=2071&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1629814596130-1c70a894a4ae?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1551884831-bbf3ddd780ef?q=80&w=800&auto=format&fit=crop"
    ],
    youtubeIds: ["v72134k9Kj4", "Wj0-2P_0djY"], 
    sellerNotes: "Cavalo de extrema docilidade. Viaja bem, não tem vícios de cocheira.",
    documents: [
        { title: "Vet Check Completo (2025)", url: "https://example.com/vet1.pdf" },
        { title: "Raio-X Membros Posteriores", url: "https://example.com/xray.pdf" },
        { title: "Certificado de Registro ABCCH", url: "https://example.com/reg.pdf" }
    ]
  },
  {
    id: '2',
    auctionId: 'evt1',
    lotNumber: 2,
    name: "Bella Donna",
    breed: "KWPN",
    dob: "2020-05-20",
    gender: "Mare",
    sire: "Bordeaux",
    dam: "Prima Donna",
    damSire: "Jazz",
    discipline: "Adestramento",
    height: "1.68m",
    description: "Elegância pura. Bella Donna possui andamentos flutuantes e um temperamento cooperativo.",
    imageUrl: "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?q=80&w=800&auto=format&fit=crop",
    startPrice: 35000,
    currentPrice: 35000,
    installments: 30,
    status: AuctionStatus.ACTIVE,
    endTime: addMinutes(now, 2.5),
    bids: [],
    galleryImages: [
        "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1534008277239-66175e1136b9?q=80&w=800&auto=format&fit=crop"
    ],
    youtubeIds: ["h-0G_FI61a8"],
    documents: [
        { title: "Atestado de Prenhez", url: "https://example.com/exam.pdf" }
    ]
  }
];
