# 🐎 Horse Bid Market - Sistema de Leilão Automático

Este é um sistema premium de leilão de cavalos com lances em tempo real e análise de pedigree via IA.

## 🚀 Como colocar no ar (Deploy Rápido)

### 1. Banco de Dados (Supabase)
1. Crie um projeto em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor** e execute o código abaixo para criar as tabelas:

```sql
-- Perfis de Usuário
create table public.profiles (
  id uuid references auth.users not null primary key,
  name text,
  cpf text,
  phone text,
  role text default 'USER',
  created_at timestamp with time zone default now()
);

-- Eventos de Leilão
create table public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  cover_image text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text default 'ACTIVE'
);

-- Lotes (Cavalos)
create table public.lots (
  id uuid default gen_random_uuid() primary key,
  auction_id uuid references public.events not null,
  lot_number integer not null,
  name text not null,
  breed text,
  description text,
  image_url text,
  start_price numeric not null,
  current_price numeric not null,
  increment_amount numeric default 500,
  installments integer default 30,
  status text default 'ACTIVE',
  end_time timestamp with time zone not null
);

-- Lances
create table public.bids (
  id uuid default gen_random_uuid() primary key,
  lot_id uuid references public.lots not null,
  user_id uuid references auth.users not null,
  amount numeric not null,
  created_at timestamp with time zone default now()
);

-- Habilitar Realtime
alter publication supabase_realtime add table bids;
alter publication supabase_realtime add table lots;
```

### 2. Configuração do GitHub & Hospedagem (Vercel/Netlify)
1. Suba este código para o seu repositório GitHub.
2. Conecte o repositório à **Vercel** ou **Netlify**.
3. No painel da hospedagem, adicione as seguintes **Environment Variables**:
   - `REACT_APP_SUPABASE_URL`: (Sua URL do Supabase)
   - `REACT_APP_SUPABASE_ANON_KEY`: (Sua Anon Public Key)
   - `API_KEY`: (Sua chave da Google Gemini API)

## 🤖 Funcionalidades IA
O sistema utiliza o modelo **Gemini 3 Flash** para analisar o pedigree dos cavalos e responder dúvidas técnicas dos compradores em tempo real no chat do lote.
