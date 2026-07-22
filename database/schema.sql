create table if not exists public.projects (
  id text primary key,
  title text not null,
  category text not null,
  location text not null,
  year integer not null check (year between 1900 and 2100),
  status text not null,
  service text not null,
  summary text not null,
  image text not null default '',
  model_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_category_idx on public.projects (category);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects (id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_images_project_id_idx on public.project_images (project_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

insert into public.projects (id, title, category, location, year, status, service, summary, image)
values
  ('2a-webster-street-residential-infill', '2A Webster Street', 'Residential', '2A Webster Street, VIC', 2026, 'Completed', 'Residential infill', 'A compact residential infill project shaped around site efficiency, planning clarity, and a carefully resolved street presence.', ''),
  ('5-bellairs-avenue-multi-residential-development', '5 Bellairs Avenue', 'Residential', '5 Bellairs Avenue, VIC', 2026, 'Completed', 'Multi-residential development', 'A multi-residential development balancing density, amenity, access, and durable architectural expression.', ''),
  ('24-parson-street-townhouse', '24 Parson Street', 'Residential', '24 Parson Street, VIC', 2026, 'Completed', 'Townhouse', 'A townhouse project focused on efficient planning, private outdoor space, and a refined residential scale.', ''),
  ('28-linton-avenue-residential', '28 Linton Avenue', 'Residential', '28 Linton Avenue, VIC', 2026, 'Completed', 'Residential', 'A residential project developed with a clear emphasis on proportion, everyday usability, and careful detailing.', ''),
  ('31-gent-street-yarraville-townhouse', '31 Gent Street Yarraville', 'Residential', '31 Gent Street, Yarraville VIC', 2026, 'Completed', 'Townhouse', 'A Yarraville townhouse project designed around urban living, compact circulation, and strong material character.', ''),
  ('87-93-elm-park-drive-commercial', '87-93 Elm Park Drive', 'Commercial', '87-93 Elm Park Drive, VIC', 2026, 'Completed', 'Commercial', 'A commercial project coordinating practical frontage, flexible tenancy needs, and a clean architectural identity.', ''),
  ('4l-coral-coast-drive-apartment', '4L Coral Coast Drive', 'Residential', '4L Coral Coast Drive, VIC', 2026, 'Planning', 'Apartment', 'An apartment project currently on the board, exploring efficient layouts, outlook, natural light, and contemporary coastal living.', ''),
  ('8-10-manly-street-office-mixed-use-development', '8-10 Manly Street', 'Commercial', '8-10 Manly Street, VIC', 2026, 'Planning', 'Office mixed-use development', 'A future mixed-use office project considering street activation, flexible workspaces, and coordinated commercial services.', ''),
  ('62-64-hook-street-multi-residential-development', '62-64 Hook Street', 'Residential', '62-64 Hook Street, VIC', 2026, 'Planning', 'Multi-residential development', 'A multi-residential proposal focused on planning yield, amenity, circulation, and a balanced neighbourhood response.', ''),
  ('94-somerville-road-residential-infill', '94 Somerville Road', 'Residential', '94 Somerville Road, VIC', 2026, 'Planning', 'Residential infill', 'A residential infill project in early planning, with attention to site constraints, outlook, and a clear buildable framework.', ''),
  ('115-123-alfred-road-aquatic-and-child-care-centre', '115-123 Alfred Road', 'Commercial', '115-123 Alfred Road, VIC', 2026, 'Planning', 'Aquatic and child care centre', 'A community-focused future project bringing together aquatic, child care, access, safety, and public-facing operational requirements.', ''),
  ('185-leakes-road-commercial-development', '185 Leakes Road', 'Commercial', '185 Leakes Road, VIC', 2026, 'Planning', 'Commercial development', 'A commercial development proposal shaped around visibility, circulation, tenancy flexibility, and long-term operational value.', ''),
  ('250-ross-street-heritage-extension', '250 Ross Street', 'Residential', '250 Ross Street, VIC', 2026, 'Planning', 'Heritage extension', 'A heritage extension project studying the relationship between existing character, new living spaces, and sensitive contemporary detailing.', '')
on conflict (id) do update
set
  title = excluded.title,
  category = excluded.category,
  location = excluded.location,
  year = excluded.year,
  status = excluded.status,
  service = excluded.service,
  summary = excluded.summary;
