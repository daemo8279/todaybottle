create table if not exists users (
  client_id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  client_id text primary key references users(client_id) on delete cascade,
  taste_answers jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists visits (
  id bigserial primary key,
  client_id text not null references users(client_id) on delete cascade,
  situation_answers jsonb not null,
  tarot_card_id integer not null check (tarot_card_id between 0 and 21),
  tarot_card_name text not null,
  tarot_card_name_ko text not null,
  tarot_keyword text not null,
  tarot_modifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists visits_client_created_idx
  on visits (client_id, created_at desc);

create table if not exists recommendations (
  id bigserial primary key,
  visit_id bigint not null references visits(id) on delete cascade,
  recommendation_type text not null check (recommendation_type in ('MY_TASTE','MY_CARD')),
  wine_id text not null,
  wine_name text not null,
  score numeric(5,2),
  created_at timestamptz not null default now()
);

create index if not exists recommendations_visit_idx
  on recommendations (visit_id);


create table if not exists wines (
  id bigserial primary key,
  wine_name text not null,
  producer text,
  wine_type text not null check (wine_type in ('RED','WHITE','SPARKLING','ROSE','ORANGE')),
  country text,
  region text,
  grape text,
  vintage text,
  price_krw integer,
  sweetness integer not null default 1 check (sweetness between 1 and 5),
  acidity integer not null check (acidity between 1 and 5),
  tannin integer not null check (tannin between 1 and 5),
  body integer not null check (body between 1 and 5),
  alcohol integer not null default 3 check (alcohol between 1 and 5),
  fruit_intensity integer not null check (fruit_intensity between 1 and 5),
  aroma_intensity integer not null check (aroma_intensity between 1 and 5),
  oak_intensity integer not null check (oak_intensity between 1 and 5),
  freshness integer not null check (freshness between 1 and 5),
  mineral integer not null default 3 check (mineral between 1 and 5),
  complexity integer not null check (complexity between 1 and 5),
  novelty_level integer not null check (novelty_level between 1 and 5),
  approachability integer not null default 3 check (approachability between 1 and 5),
  traditional_score integer not null default 3 check (traditional_score between 1 and 5),
  blend_yn boolean not null default false,
  aroma_family jsonb not null default '[]'::jsonb,
  food_pairing_tags jsonb not null default '[]'::jsonb,
  occasion_tags jsonb not null default '[]'::jsonb,
  style_description text not null,
  mood_description text not null,
  source_url text,
  source_text text,
  ai_model text,
  ai_confidence numeric(4,3),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wines_verified_idx on wines (verified, created_at desc);
create index if not exists wines_type_idx on wines (wine_type);
