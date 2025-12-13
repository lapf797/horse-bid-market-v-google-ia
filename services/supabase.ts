
import { createClient } from '@supabase/supabase-js';

// Substitua estas variáveis pelas suas chaves do Supabase Dashboard
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'SUA_URL_SUPABASE_AQUI';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'SUA_CHAVE_ANON_AQUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funções Auxiliares de Banco de Dados

export const fetchActiveEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'ACTIVE');
  if (error) throw error;
  return data;
};

export const fetchLotsByEvent = async (eventId: string) => {
  const { data, error } = await supabase
    .from('lots')
    .select(`
      *,
      bids (
        amount,
        created_at,
        user_id
      )
    `)
    .eq('auction_id', eventId)
    .order('lot_number', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const placeRealBid = async (lotId: string, amount: number, userId: string) => {
  // 1. Inserir o lance
  const { error: bidError } = await supabase
    .from('bids')
    .insert([{ lot_id: lotId, user_id: userId, amount: amount }]);

  if (bidError) throw bidError;

  // 2. Atualizar o preço atual do lote
  const { error: lotError } = await supabase
    .from('lots')
    .update({ current_price: amount })
    .eq('id', lotId);

  if (lotError) throw lotError;

  return true;
};
