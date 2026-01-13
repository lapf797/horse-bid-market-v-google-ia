
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChange } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Configuração do Google Cloud / Firebase
// Estas variáveis devem ser configuradas no seu ambiente de produção do GCP
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Verifica se o GCP está configurado
export const isGCPConfigured = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined");

// Inicialização
const app = isGCPConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// --- FUNÇÕES DE LANCE (REALTIME) ---

export const placeBidGCP = async (lotId: string, amount: number, userId: string, userName: string) => {
  if (!db) throw new Error("Google Cloud não configurado.");
  
  const lotRef = doc(db, 'lots', lotId);
  const lotSnap = await getDoc(lotRef);
  
  if (!lotSnap.exists()) throw new Error("Lote não encontrado.");
  
  const lotData = lotSnap.data();
  if (amount <= lotData.currentPrice) {
    throw new Error("O lance deve ser maior que o preço atual.");
  }

  // Registra o lance na sub-coleção e atualiza o lote (Atomicamente seria melhor via transação no GCP)
  await addDoc(collection(db, 'lots', lotId, 'bids'), {
    amount,
    userId,
    userName,
    timestamp: new Date()
  });

  await updateDoc(lotRef, {
    currentPrice: amount,
    lastBidder: userName
  });

  return true;
};

// --- BUSCA DE EVENTOS ---

export const streamActiveEvents = (callback: (events: any[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, 'events'), where('status', '==', 'ACTIVE'), orderBy('startTime', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(events);
  });
};

export const streamLotsByEvent = (eventId: string, callback: (lots: any[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, 'lots'), where('auctionId', '==', eventId), orderBy('lotNumber', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const lots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(lots);
  });
};
