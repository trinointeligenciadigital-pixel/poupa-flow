-- SCRIPT DE CORREÇÃO DE EXCLUSÃO (DELETE RLS) NO SUPABASE
-- Execute este script no SQL Editor do seu painel Supabase.

-- ==========================================
-- 1. CORREÇÃO DAS POLÍTICAS DA TABELA ACCOUNTS
-- ==========================================

-- Remover política genérica antiga para evitar conflitos
drop policy if exists "Allow group members access to accounts" on public.accounts;
drop policy if exists "Permitir leitura de contas" on public.accounts;
drop policy if exists "Permitir inserção de contas" on public.accounts;
drop policy if exists "Permitir atualização de contas" on public.accounts;
drop policy if exists "Permitir exclusão de contas" on public.accounts;

-- Criar políticas granulares seguras para accounts
create policy "Permitir leitura de contas"
on public.accounts for select
using (group_id in (select group_id from public.profiles where id = auth.uid()));

create policy "Permitir inserção de contas"
on public.accounts for insert
with check (group_id in (select group_id from public.profiles where id = auth.uid()));

create policy "Permitir atualização de contas"
on public.accounts for update
using (group_id in (select group_id from public.profiles where id = auth.uid()));

create policy "Permitir exclusão de contas"
on public.accounts for delete
using (group_id in (select group_id from public.profiles where id = auth.uid()));


-- ==============================================
-- 2. CORREÇÃO DAS POLÍTICAS DA TABELA TRANSACTIONS
-- ==============================================

-- Remover política genérica antiga
drop policy if exists "Allow group members access to transactions" on public.transactions;
drop policy if exists "Permitir leitura de transacoes" on public.transactions;
drop policy if exists "Permitir insercao de transacoes" on public.transactions;
drop policy if exists "Permitir atualizacao de transacoes" on public.transactions;
drop policy if exists "Permitir exclusao de transacoes" on public.transactions;

-- Criar políticas granulares seguras para transactions
create policy "Permitir leitura de transacoes"
on public.transactions for select
using (group_id in (select group_id from public.profiles where id = auth.uid()));

create policy "Permitir insercao de transacoes"
on public.transactions for insert
with check (group_id in (select group_id from public.profiles where id = auth.uid()));

create policy "Permitir atualizacao de transacoes"
on public.transactions for update
using (group_id in (select group_id from public.profiles where id = auth.uid()));

create policy "Permitir exclusao de transacoes"
on public.transactions for delete
using (group_id in (select group_id from public.profiles where id = auth.uid()));
