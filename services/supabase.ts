
import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: Nunca coloque as chaves reais hardcoded aqui se for enviar para o GitHub.
// Configure-as nas "Environment Variables" da sua hospedagem (Vercel/Netlify).

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Verificação de segurança para ajudar no debug
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ AVISO: As chaves do Supabase não foram encontradas nas variáveis de ambiente.");
  console.warn("Verifique se REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY estão configuradas.");
}

// Inicializa o cliente. Usamos valores placeholder se as vars não existirem para evitar crash imediato,
// mas as requisições falharão até que você configure o ambiente.
export const supabase = createClient(
  supabaseUrl || 'https://seu-projeto.supabase.co', 
  supabaseAnonKey || 'sua-chave-anonima'
);

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
