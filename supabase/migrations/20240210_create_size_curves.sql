-- Create Size Curves Table for Shams Store
create table if not exists public.size_curves (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    sizes jsonb not null default '[]'::jsonb, -- Array of strings e.g. ["S", "M", "L"]
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.size_curves enable row level security;

-- Policies (Admin Access)
create policy "Public read access for size_curves"
on public.size_curves for select
to public
using (true);

create policy "Admin insert access for size_curves"
on public.size_curves for insert
to authenticated
with check (true);

create policy "Admin update access for size_curves"
on public.size_curves for update
to authenticated
using (true);

create policy "Admin delete access for size_curves"
on public.size_curves for delete
to authenticated
using (true);
