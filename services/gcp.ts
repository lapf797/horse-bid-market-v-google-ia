
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

export const isGCPConfigured = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined" && firebaseConfig.apiKey !== "");

const app = isGCPConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// --- GESTÃO DE USUÁRIOS ---

export const streamAllUsers = (callback: (users: any[]) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, 'profiles'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};

export const updateUserStatus = async (userId: string, status: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'profiles', userId), { status });
};

// --- GESTÃO DE EVENTOS E LOTES ---

export const createAuctionEvent = async (eventData: any) => {
    if (!db) return;
    await addDoc(collection(db, 'events'), {
        ...eventData,
        createdAt: serverTimestamp()
    });
};

export const updateAuctionEvent = async (eventId: string, eventData: any) => {
    if (!db) return;
    await updateDoc(doc(db, 'events', eventId), eventData);
};

export const createHorseLot = async (lotData: any) => {
    if (!db) return;
    await addDoc(collection(db, 'lots'), {
        ...lotData,
        currentPrice: lotData.startPrice,
        createdAt: serverTimestamp()
    });
};

export const updateHorseLot = async (lotId: string, lotData: any) => {
    if (!db) return;
    await updateDoc(doc(db, 'lots', lotId), lotData);
};

// --- GESTÃO DE SUBMISSÕES (CURADORIA) ---

export const streamSubmissions = (callback: (subs: any[]) => void) => {
    if (!db) return () => {};
    const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
};

export const approveSubmission = async (subId: string, lotData: any) => {
    if (!db) return;
    // 1. Cria o lote oficial
    await createHorseLot(lotData);
    // 2. Marca submissão como aprovada
    await updateDoc(doc(db, 'submissions', subId), { status: 'APPROVED' });
};

// --- LANCES ---

export const placeBidGCP = async (lotId: string, amount: number, userId: string, userName: string) => {
  if (!db) return true;
  
  const lotRef = doc(db, 'lots', lotId);
  const lotSnap = await getDoc(lotRef);
  
  if (!lotSnap.exists()) throw new Error("Lote indisponível.");
  
  const lotData = lotSnap.data();
  if (amount < (lotData.currentPrice + (lotData.incrementAmount || 500))) {
    throw new Error(`LANCE INVÁLIDO: O incremento mínimo é de R$ ${lotData.incrementAmount || 500}`);
  }

  await addDoc(collection(db, 'lots', lotId, 'bids'), {
    amount,
    userId,
    userName,
    timestamp: serverTimestamp()
  });

  await updateDoc(lotRef, {
    currentPrice: amount,
    lastBidder: userName,
    // Prorrogação automática: se faltar menos de 60s, adiciona mais 60s
    endTime: (new Date(lotData.endTime.toDate()).getTime() - Date.now() < 60000) 
        ? new Date(Date.now() + 60000) 
        : lotData.endTime
  });

  return true;
};

export const streamActiveEvents = (callback: (events: any[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, 'events'), orderBy('startTime', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate()
    }));
    callback(events);
  });
};

export const streamLotsByEvent = (eventId: string, callback: (lots: any[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, 'lots'), where('auctionId', '==', eventId), orderBy('lotNumber', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const lots = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        endTime: doc.data().endTime?.toDate() 
    }));
    callback(lots);
  });
};
