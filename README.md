
# 🐎 Horse Bid Market - Operação Real

Siga estes passos para ativar o backend e sair do modo demo.

### 1. Configuração do Banco de Dados (Supabase)
Execute o script abaixo no **SQL Editor** do Supabase:

```sql
-- 1. Tabelas Base
create table public.profiles (
  id uuid references auth.users not null primary key,
  name text,
  cpf text,
  phone text,
  role text default 'USER',
  created_at timestamp with time zone default now()
);

create table public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  cover_image text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text default 'ACTIVE',
  payment_config_id text default 'p1'
);

create table public.lots (
  id uuid default gen_random_uuid() primary key,
  auction_id uuid references public.events on delete cascade not null,
  lot_number integer not null,
  name text not null,
  breed text,
  dob date,
  gender text,
  sire text,
  dam text,
  dam_sire text,
  discipline text,
  height text,
  description text,
  image_url text,
  youtube_id text,
  seller_notes text,
  start_price numeric not null,
  current_price numeric not null,
  increment_amount numeric default 500,
  installments integer default 30,
  status text default 'ACTIVE',
  end_time timestamp with time zone not null,
  gallery_images text[]
);

create table public.bids (
  id uuid default gen_random_uuid() primary key,
  lot_id uuid references public.lots on delete cascade not null,
  user_id uuid references auth.users not null,
  amount numeric not null,
  created_at timestamp with time zone default now()
);

create table public.submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  horse_name text not null,
  breed text,
  sire text,
  dam text,
  target_price numeric,
  photos jsonb,
  status text default 'PENDING',
  created_at timestamp with time zone default now()
);

-- 2. Gatilho para atualizar o preço do lote automaticamente ao receber um lance
create or replace function public.handle_new_bid()
returns trigger as $$
begin
  update public.lots
  set current_price = NEW.amount
  where id = NEW.lot_id;
  return NEW;
end;
$$ language plpgsql;

create trigger on_bid_placed
  after insert on public.bids
  for each row execute procedure public.handle_new_bid();

-- 3. Habilitar Realtime
alter publication supabase_realtime add table bids;
alter publication supabase_realtime add table lots;

-- 4. Segurança (RLS)
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.lots enable row level security;
alter table public.bids enable row level security;

create policy "Perfis são públicos" on public.profiles for select using (true);
create policy "Usuários editam próprio perfil" on public.profiles for update using (auth.uid() = id);
create policy "Leilões são visíveis para todos" on public.events for select using (true);
create policy "Lotes são visíveis para todos" on public.lots for select using (true);
create policy "Lances são visíveis para todos" on public.bids for select using (true);
create policy "Apenas autenticados podem dar lances" on public.bids for insert with check (auth.role() = 'authenticated');
```

### 2. Variáveis de Ambiente
No seu painel da Vercel/Netlify, adicione obrigatoriamente:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `API_KEY` (Sua chave da Google Gemini)
