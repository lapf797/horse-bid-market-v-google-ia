
export enum AuctionStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  PASSED = 'PASSED',
  REPURCHASE = 'REPURCHASE',
  SOLD = 'SOLD',
}

export interface PaymentConfig {
  id: string;
  name: string; // e.g., "30 Parcelas (2+2+2+24)"
  installments: number; // e.g., 30
  description: string;
}

export interface AuctionEvent {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  startTime: Date;
  endTime: Date; // General close time, though lots close individually
  status: AuctionStatus;
  paymentConfigId?: string; // Default payment rule for this event
}

export interface Bid {
  id: string;
  bidderName: string; // Obfuscated usually, e.g., "User ***123"
  amount: number;
  timestamp: Date;
}

export interface HorseLot {
  id: string;
  auctionId: string;
  lotNumber: number;
  name: string;
  breed: string;
  dob: string; // Date of Birth
  gender: 'Mare' | 'Stallion' | 'Gelding';
  sire: string;
  dam: string;
  damSire: string;
  discipline: string;
  height: string;
  description: string;
  imageUrl: string;
  videoUrl?: string; // Placeholder
  startPrice: number;
  currentPrice: number;
  incrementAmount?: number; // Minimum bid increment
  installments: number; // Number of installments (e.g., 30)
  status: AuctionStatus;
  endTime: Date;
  bids: Bid[];
  pedigreeAnalysis?: string; // Pre-filled or generated
  
  // New Fields
  galleryImages?: string[]; // Up to 10 images
  documents?: { title: string; url: string }[]; // Up to 5 PDFs
  youtubeId?: string; // YouTube Video ID
  sellerNotes?: string; // Special comments from seller
}

export interface SellerSubmission {
  id: string;
  abcchId: string;
  name: string;
  breed: string;
  dob: string;
  gender: 'Mare' | 'Stallion' | 'Gelding';
  sire: string;
  dam: string;
  damSire: string;
  discipline: string;
  height: string;
  description: string;
  photos: {
    left: string;
    right: string;
    front: string;
    back: string;
    legs: string;
    head: string;
  };
  youtubeLink: string;
  documents: { title: string; file: string }[]; // Using string (url/name) for mock
  sellerName: string;
  sellerEmail: string;
  targetPrice: number; // Valor Objetivo
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}