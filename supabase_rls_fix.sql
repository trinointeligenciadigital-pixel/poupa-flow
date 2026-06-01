-- CORREÇÃO DE SEGURANÇA E RLS PARA A TABELA GROUPS NO SUPABASE
-- Execute este script no SQL Editor do seu painel Supabase.

-- 1. Excluir políticas antigas da tabela groups (caso existam)
drop policy if exists "Permitir leitura de grupos para todos os usuários" on public.groups;
drop policy if exists "Permitir criação de grupos para todos os usuários" on public.groups;

-- 2. Criar política que permite a inserção pública de novos grupos
-- (Necessário para que novos usuários cadastrem um grupo antes de logar)
create policy "Permitir criação de grupos para todos os usuários"
on public.groups for insert
with check (true);

-- 3. Criar política que permite a leitura de grupos
-- (Necessário para validar códigos de convite no fluxo 'Participar Existente')
create policy "Permitir leitura de grupos para todos os usuários"
on public.groups for select
using (true);
