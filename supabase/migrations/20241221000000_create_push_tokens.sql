-- Create push_tokens table to track devices
create table if not exists push_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  token text unique not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  last_active timestamptz default now(),
  created_at timestamptz default now()
);

-- Index for faster lookups
create index if not exists idx_push_tokens_user_id on push_tokens(user_id);
create index if not exists idx_push_tokens_platform on push_tokens(platform);

-- Enable RLS
alter table push_tokens enable row level security;

-- Policies
create policy "Users can insert their own tokens" on push_tokens
  for insert with check (auth.uid() = user_id);

create policy "Users can read their own tokens" on push_tokens
  for select using (auth.uid() = user_id);

create policy "Users can delete their own tokens" on push_tokens
  for delete using (auth.uid() = user_id);

-- Admin policy (if you have an admin role system, add here)
-- For now, we'll let authenticated users read/write their own
