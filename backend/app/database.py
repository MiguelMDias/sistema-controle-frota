import os
from functools import lru_cache

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()


@lru_cache
def get_supabase() -> Client:
    """
    Cliente Supabase usando a service_role key.
    Isso ignora RLS -- por isso o backend é a única camada que deve
    ter essa chave. O frontend nunca fala direto com o Supabase.
    """
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)
