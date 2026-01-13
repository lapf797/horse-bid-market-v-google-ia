
export enum AuctionStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  PASSED = 'PASSED',
  REPURCHASE = 'REPURCHASE',
  SOLD = 'SOLD',
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  BLOCKED = 'BLOCKED',
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  status: UserStatus;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
}

export interface PaymentConfig {
  id: string;
  name: string;
  installments: number;
  description: string;
}

export interface AuctionEvent {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  startTime: Date;
  endTime: Date;
  status: AuctionStatus;
  paymentConfigId?: string;
}

export interface Bid {
  id: string;
  bidderName: string;
  amount: number;
  timestamp: Date;
}

export interface HorseLot {
  id: string;
  auctionId: string;
  lotNumber: number;
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
  imageUrl: string;
  videoUrl?: string;
  startPrice: number;
  currentPrice: number;
  incrementAmount?: number;
  installments: number;
  status: AuctionStatus;
  endTime: Date;
  bids: Bid[];
  pedigreeAnalysis?: string;
  galleryImages?: string[];
  documents?: { title: string; url: string }[];
  youtubeIds?: string[];
  sellerNotes?: string;
}

export interface SellerSubmission {
  id: string;
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
  galleryPhotos: string[];
  youtubeLink: string;
  youtubeLink2?: string;
  documentLinks: { title: string; url: string }[];
  sellerName: string;
  sellerEmail: string;
  targetPrice: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
