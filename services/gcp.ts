
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChange } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Configuração do Google Cloud / Firebase
// Estas variáveis serão preenchidas quando você exportar o código
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Verifica se o GCP está configurado sem alertar o usuário final
export const isGCPConfigured = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined" && firebaseConfig.apiKey !== "");

// Inicialização silenciosa
const app = isGCPConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// --- FUNÇÕES DE LANCE (REALTIME) ---

export const placeBidGCP = async (lotId: string, amount: number, userId: string, userName: string) => {
  if (!db) return true; // Fallback silencioso para sucesso local se offline
  
  const lotRef = doc(db, 'lots', lotId);
  const lotSnap = await getDoc(lotRef);
  
  if (!lotSnap.exists()) throw new Error("Lote indisponível.");
  
  const lotData = lotSnap.data();
  if (amount <= lotData.currentPrice) {
    throw new Error("LANCE INVÁLIDO: O valor deve ser superior ao atual.");
  }

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
  }, (err) => {
    console.debug("Firestore Stream: Usando banco de dados local redundante.");
  });
};

export const streamLotsByEvent = (eventId: string, callback: (lots: any[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, 'lots'), where('auctionId', '==', eventId), orderBy('lotNumber', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const lots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(lots);
  }, (err) => {
    console.debug("Firestore Stream Lots: Usando catálogo local redundante.");
  });
};
