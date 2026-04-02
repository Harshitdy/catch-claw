-- mem0 Supabase vector store (official snippet from https://docs.mem0.ai/components/vectordbs/dbs/supabase).
-- The Python client (mem0ai + vecs) can auto-create collections via connection_string; this migration
-- matches the docs for setups that use the memories table and match_vectors RPC directly (e.g. TypeScript).

create extension if not exists vector;

create table if not exists memories (
  id text primary key,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create or replace function match_vectors(
  query_embedding vector(1536),
  match_count int,
  filter jsonb default '{}'::jsonb
)
returns table (
  id text,
  similarity float,
  metadata jsonb
)
language plpgsql
as $$
begin
  return query
  select
    t.id::text,
    1 - (t.embedding <=> query_embedding) as similarity,
    t.metadata
  from memories t
  where case
    when filter::text = '{}'::text then true
    else t.metadata @> filter
  end
  order by t.embedding <=> query_embedding
  limit match_count;
end;
$$;
