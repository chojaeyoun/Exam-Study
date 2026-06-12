create table if not exists public.exam_tabs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_questions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id text not null references public.exam_tabs(id) on delete cascade,
  category text not null default '미분류',
  level text not null default '중',
  question text not null,
  answer text not null,
  memo text not null default '',
  status text not null default 'new',
  wrong_count integer not null default 0,
  mastered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exam_tabs enable row level security;
alter table public.exam_questions enable row level security;

drop policy if exists "Users can read their exam tabs" on public.exam_tabs;
drop policy if exists "Users can insert their exam tabs" on public.exam_tabs;
drop policy if exists "Users can update their exam tabs" on public.exam_tabs;
drop policy if exists "Users can delete their exam tabs" on public.exam_tabs;

create policy "Users can read their exam tabs"
on public.exam_tabs for select
using (auth.uid() = user_id);

create policy "Users can insert their exam tabs"
on public.exam_tabs for insert
with check (auth.uid() = user_id);

create policy "Users can update their exam tabs"
on public.exam_tabs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their exam tabs"
on public.exam_tabs for delete
using (auth.uid() = user_id);

drop policy if exists "Users can read their questions" on public.exam_questions;
drop policy if exists "Users can insert their questions" on public.exam_questions;
drop policy if exists "Users can update their questions" on public.exam_questions;
drop policy if exists "Users can delete their questions" on public.exam_questions;

create policy "Users can read their questions"
on public.exam_questions for select
using (auth.uid() = user_id);

create policy "Users can insert their questions"
on public.exam_questions for insert
with check (auth.uid() = user_id);

create policy "Users can update their questions"
on public.exam_questions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their questions"
on public.exam_questions for delete
using (auth.uid() = user_id);
