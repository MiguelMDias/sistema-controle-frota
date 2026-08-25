from fastapi import HTTPException

from app.database import get_supabase

# Situações da máquina que NÃO permitem novos lançamentos ou edições
# (manutenção, abastecimento, nota fiscal, checklist).
SITUACOES_BLOQUEADAS = {"inativa", "baixada"}


def validar_maquina_permite_lancamento(maquina_id: int) -> dict:
    """
    Busca a máquina e garante que ela está numa situação que permite
    lançamentos (ativa ou em manutenção). Lança 422 caso contrário.
    Retorna o registro da máquina para reaproveitamento (ex: código, tipo).
    """
    sb = get_supabase()
    resp = sb.table("maquinas").select("id, codigo, situacao").eq("id", maquina_id).execute()
    if not resp.data:
        raise HTTPException(status_code=422, detail="Máquina informada não existe")

    maquina = resp.data[0]
    if maquina["situacao"] in SITUACOES_BLOQUEADAS:
        raise HTTPException(
            status_code=422,
            detail=f"A máquina {maquina['codigo']} está {maquina['situacao']} e não permite novos lançamentos.",
        )
    return maquina
