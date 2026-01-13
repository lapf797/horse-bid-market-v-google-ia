
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

const createDummyClient = () => {
  return {
    auth: {
      signUp: async () => ({ data: { user: null }, error: new Error("Supabase não configurado") }),
      signInWithPassword: async () => ({ data: { user: null }, error: new Error("Supabase não configurado") }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        neq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
        eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: () => {},
  } as unknown as SupabaseClient;
};

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createDummyClient();

// --- FUNÇÕES DE BUSCA ---

export const fetchActiveEvents = async () => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .neq('status', 'ENDED')
    .order('start_time', { ascending: true });
  if (error) throw error;
  return data;
};

export const fetchLotsByEvent = async (eventId: string) => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('lots')
    .select(`*, bids (id, amount, created_at, user_id)`)
    .eq('auction_id', eventId)
    .order('lot_number', { ascending: true });
  if (error) throw error;
  return data;
};

// --- FUNÇÕES DE OPERAÇÃO ---

export const placeRealBid = async (lotId: string, amount: number, userId: string) => {
  if (!isSupabaseConfigured) throw new Error("Supabase não configurado");
  const { error } = await supabase
    .from('bids')
    .insert([{ lot_id: lotId, user_id: userId, amount }]);
  if (error) throw error;
  return true;
};

export const submitHorseForReview = async (submission: any, userId: string) => {
  if (!isSupabaseConfigured) return true; // Sucesso fake no modo demo
  const { error } = await supabase
    .from('submissions')
    .insert([{
        user_id: userId,
        horse_name: submission.name,
        breed: submission.breed,
        sire: submission.sire,
        dam: submission.dam,
        target_price: submission.targetPrice,
        photos: submission.photos,
        status: 'PENDING'
    }]);
  if (error) throw error;
  return true;
};

export const createNewEvent = async (eventData: any) => {
    if (!isSupabaseConfigured) return { id: 'temp-id' };
    const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();
    if (error) throw error;
    return data;
};
