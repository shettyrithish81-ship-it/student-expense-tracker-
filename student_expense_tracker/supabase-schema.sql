-- Run this in Supabase Dashboard > SQL Editor > New query
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  amount numeric(12,2) not null check (amount > 0),
  category text not null check (category in ('Food','Travel','Books','College','Shopping','Other')),
  date date not null,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;
drop policy if exists "Users can view their own expenses" on public.expenses;
drop policy if exists "Users can insert their own expenses" on public.expenses;
drop policy if exists "Users can update their own expenses" on public.expenses;
drop policy if exists "Users can delete their own expenses" on public.expenses;
create policy "Users can view their own expenses" on public.expenses for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert their own expenses" on public.expenses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own expenses" on public.expenses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own expenses" on public.expenses for delete to authenticated using ((select auth.uid()) = user_id);
create index if not exists expenses_user_date_idx on public.expenses (user_id, date desc);
