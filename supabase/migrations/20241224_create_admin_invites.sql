-- Create admin_invites table for managing admin invitations
create table if not exists admin_invites (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'master_admin')),
  invited_by uuid references auth.users(id),
  status text not null check (status in ('pending', 'accepted', 'expired', 'revoked')) default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add indexes
create index if not exists idx_admin_invites_email on admin_invites(email);
create index if not exists idx_admin_invites_status on admin_invites(status);

-- Enable RLS
alter table admin_invites enable row level security;

-- Policies
-- Only existing admins can view invites
create policy "Admins can view invites" on admin_invites
  for select to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'master_admin'))
  );

-- Only existing admins can insert invites
create policy "Admins can create invites" on admin_invites
  for insert to authenticated
  with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'master_admin'))
  );

-- Only admins can update invites (e.g. to revoke)
create policy "Admins can update invites" on admin_invites
  for update to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'master_admin'))
  );

-- Trigger to update updated_at
create trigger update_admin_invites_updated_at
  before update on admin_invites
  for each row execute function update_updated_at_column();
