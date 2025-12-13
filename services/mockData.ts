
import { HorseLot, AuctionEvent, AuctionStatus, SellerSubmission, PaymentConfig } from '../types';

const now = new Date();

// Helper to create dates relative to now
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

export const MOCK_SUBMISSIONS: SellerSubmission[] = [
    {
        id: 'sub1',
        abcchId: '12345-BR',
        name: 'Thunder Boy',
        breed: 'BH',
        dob: '2021-11-15',
        gender: 'Stallion',
        sire: 'Thunder van de Zuuthoeve',
        dam: 'Lady Killer',
        damSire: 'Landadel',
        discipline: 'Salto',
        height: '1.68m',
        description: 'Potro com muito sangue e força. Salta com muita técnica.',
        photos: {
            left: 'https://picsum.photos/id/100/300/200',
            right: 'https://picsum.photos/id/101/300/200',
            front: 'https://picsum.photos/id/102/300/200',
            back: 'https://picsum.photos/id/103/300/200',
            legs: 'https://picsum.photos/id/104/300/200',
            head: 'https://picsum.photos/id/105/300/200',
        },
        youtubeLink: 'https://youtu.be/example',
        documents: [],
        sellerName: 'João Criador',
        sellerEmail: 'joao@haras.com',
        targetPrice: 60000,
        status: 'PENDING',
        createdAt: new Date()
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
    imageUrl: "https://picsum.photos/id/1003/800/600",
    startPrice: 45000,
    currentPrice: 62000,
    installments: 30,
    status: AuctionStatus.ACTIVE,
    endTime: addMinutes(now, 5.0), // Ends in 5 minutes
    bids: [
      { id: 'b1', bidderName: 'Cliente 4492', amount: 45000, timestamp: addMinutes(now, -1200) },
      { id: 'b2', bidderName: 'Cliente 9921', amount: 48000, timestamp: addMinutes(now, -1000) },
      { id: 'b3', bidderName: 'Cliente 3321', amount: 55000, timestamp: addMinutes(now, -300) },
      { id: 'b4', bidderName: 'Cliente 4492', amount: 62000, timestamp: addMinutes(now, -60) },
    ],
    galleryImages: [
        "https://picsum.photos/id/1003/800/600",
        "https://images.unsplash.com/photo-1551884831-bbf3ddd780ef?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1629814596130-1c70a894a4ae?q=80&w=800&auto=format&fit=crop"
    ],
    youtubeId: "v72134k9Kj4", 
    sellerNotes: "Cavalo de extrema docilidade. Viaja bem, não tem vícios de cocheira. Está sendo trabalhado pelo cavaleiro olímpico José da Silva há 6 meses. Potencial para GP.",
    documents: [
        { title: "Vet Check Completo (10/2024)", url: "#" },
        { title: "Laudo Radiológico (Raio-X)", url: "#" },
        { title: "Registro Genealógico", url: "#" }
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
    description: "Elegância pura. Bella Donna possui andamentos flutuantes e um temperamento cooperativo. Uma futura estrela para o adestramento, carregando as melhores linhas de sangue holandesas.",
    imageUrl: "https://picsum.photos/id/1024/800/600",
    startPrice: 35000,
    currentPrice: 35000,
    installments: 30,
    status: AuctionStatus.ACTIVE,
    endTime: addMinutes(now, 2.5), // Ends in 2.5 minutes, NO BIDS - TEST REPURCHASE
    bids: [],
    galleryImages: [
        "https://picsum.photos/id/1024/800/600",
        "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?q=80&w=800&auto=format&fit=crop"
    ],
    youtubeId: "h-0G_FI61a8", 
    documents: [
        { title: "Atestado de Prenhez", url: "#" }
    ]
  },
  {
    id: '3',
    auctionId: 'evt1',
    lotNumber: 3,
    name: "Cassius Clay",
    breed: "Oldenburg",
    dob: "2018-02-14",
    gender: "Gelding",
    sire: "Casall",
    dam: "Contessa",
    damSire: "Contender",
    discipline: "CCE",
    height: "1.70m",
    description: "Corajoso e atlético, Cassius é a escolha perfeita para o CCE. Demonstra grande aptidão no cross-country e cuidado nos saltos.",
    imageUrl: "https://picsum.photos/id/1062/800/600",
    startPrice: 80000,
    currentPrice: 95000,
    installments: 30,
    status: AuctionStatus.ACTIVE,
    endTime: addMinutes(now, 1.8), // Ends in 1.8 mins (Already inside "Em Leilão" zone)
    bids: [
        { id: 'b10', bidderName: 'Cliente 1123', amount: 80000, timestamp: addMinutes(now, -2800) },
        { id: 'b11', bidderName: 'Cliente 8822', amount: 85000, timestamp: addMinutes(now, -1400) },
        { id: 'b12', bidderName: 'Cliente 1123', amount: 95000, timestamp: addMinutes(now, -120) },
    ],
    youtubeId: "Wj0-2P_0djY",
    sellerNotes: "Animal muito franco nos obstáculos naturais. Ideal para amadores competitivos."
  },
    {
    id: '4',
    auctionId: 'evt2',
    lotNumber: 101,
    name: "Quick Star Junior",
    breed: "Selle Français",
    dob: "2021-06-01",
    gender: "Stallion",
    sire: "Quick Star",
    dam: "Laudanum",
    damSire: "Almé",
    discipline: "Salto",
    height: "1.65m",
    description: "Uma promessa jovem com reflexos de gato. Sangue francês clássico para quem busca velocidade e técnica.",
    imageUrl: "https://picsum.photos/id/200/800/600",
    startPrice: 40000,
    currentPrice: 40000,
    installments: 40,
    status: AuctionStatus.UPCOMING,
    endTime: addMinutes(now, 2880),
    youtubeId: "v72134k9Kj4", 
    bids: []
  }
];