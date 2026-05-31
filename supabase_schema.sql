-- SCRIPT DE CRIAÇÃO DAS TABELAS DO POUPAFLOW NO SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase (painel web do Supabase).

-- Habilitar a extensão uuid-ossp caso não esteja habilitada
create extension if not exists "uuid-ossp";

-- 1. Tabela de Grupos Financeiros
create table if not exists public.groups (
    id uuid default gen_random_uuid() primary key,
    invite_code text unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Perfis de Usuário (vinculados ao Auth do Supabase)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    group_id uuid references public.groups(id) on delete set null,
    name text not null,
    emoji text not null,
    avatar text, -- Base64
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Contas
create table if not exists public.accounts (
    id uuid default gen_random_uuid() primary key,
    group_id uuid references public.groups(id) on delete cascade not null,
    name text not null,
    emoji text not null,
    color text not null,
    initial_balance numeric not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Transações
create table if not exists public.transactions (
    id uuid default gen_random_uuid() primary key,
    group_id uuid references public.groups(id) on delete cascade not null,
    account_id uuid references public.accounts(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    type text not null check (type in ('inflow', 'outflow')),
    amount numeric not null,
    category text not null,
    emoji text not null,
    date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabela de Despesas Fixas
create table if not exists public.fixed_expenses (
    id uuid default gen_random_uuid() primary key,
    group_id uuid references public.groups(id) on delete cascade not null,
    name text not null,
    amount numeric not null,
    category text not null,
    emoji text not null,
    due_day integer not null,
    paid_months text[] not null default '{}',
    default_account_id uuid references public.accounts(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Tabela de Configurações do Grupo (como limite de orçamento)
create table if not exists public.group_settings (
    group_id uuid references public.groups(id) on delete cascade primary key,
    monthly_budget numeric not null default 2500,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS) para segurança de dados
alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.group_settings enable row level security;

-- Criar políticas básicas permitindo leitura/escrita aos membros do mesmo grupo
-- (Estas regras garantem que o usuário só acesse dados do próprio group_id)
create policy "Users can read their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

-- Políticas simplificadas baseadas no grupo
create policy "Allow group members access to accounts" on public.accounts for all
  using (group_id in (select group_id from public.profiles where id = auth.uid()));

create policy "Allow group members access to transactions" on public.transactions for all
  using (group_id in (select group_id from public.profiles where id = auth.uid()));

create policy "Allow group members access to fixed_expenses" on public.fixed_expenses for all
  using (group_id in (select group_id from public.profiles where id = auth.uid()));

create policy "Allow group members access to settings" on public.group_settings for all
  using (group_id in (select group_id from public.profiles where id = auth.uid()));
