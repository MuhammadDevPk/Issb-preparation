-- Create complaints table
create table if not exists public.complaints (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  email text, -- For guest users
  whatsapp text, -- For guest users
  title text not null,
  description text not null,
  status text not null default 'pending', -- 'pending', 'resolved', 'closed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on complaints
alter table public.complaints enable row level security;

-- Create policies for complaints
create policy "Anyone can insert complaints"
on public.complaints
for insert
with check (true);

create policy "Admins can view all complaints"
on public.complaints
for select
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Users can view their own complaints"
on public.complaints
for select
using (auth.uid() = user_id);

create policy "Admins can update complaints"
on public.complaints
for update
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Create improvements table
create table if not exists public.improvements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  suggested_by text, -- Guest name
  title text not null,
  description text not null,
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on improvements
alter table public.improvements enable row level security;

-- Create policies for improvements
create policy "Anyone can select improvements"
on public.improvements
for select
using (true);

create policy "Anyone can insert improvements"
on public.improvements
for insert
with check (true);

create policy "Anyone can update upvotes and downvotes"
on public.improvements
for update
using (true)
with check (true);
