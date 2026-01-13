
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Accessing environment variables via process.env as per platform requirements
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

/**
 * Validates if Supabase is properly configured.
 * This prevents the app from crashing if the user hasn't set the variables yet.
 */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create the client only if configuration is present, otherwise use a proxy to prevent early crashes
// but allowing App.tsx to check isSupabaseConfigured before making calls.
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : ({} as any);

/**
 * Fetches active events from Supabase.
 * Falls back gracefully if Supabase is not configured.
 */
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

/**
 * Fetches lots for a specific event with their associated bids.
 */
export const fetchLotsByEvent = async (eventId: string) => {
  if (!isSupabaseConfigured) return [];
  
  const { data, error } = await supabase
    .from('lots')
    .select(`
      *,
      bids (
        id,
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

/**
 * Places a bid and updates the current price of the lot in a single transaction-like flow.
 */
export const placeRealBid = async (lotId: string, amount: number, userId: string) => {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured");

  const { error: bidError } = await supabase
    .from('bids')
    .insert([{ lot_id: lotId, user_id: userId, amount: amount }]);

  if (bidError) throw bidError;

  const { error: lotError } = await supabase
    .from('lots')
    .update({ current_price: amount })
    .eq('id', lotId);

  if (lotError) throw lotError;

  return true;
};
