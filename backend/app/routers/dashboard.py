from calendar import monthrange
from datetime import date

from fastapi import APIRouter

from app.database import get_supabase

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/resumo")
def resumo():
    """
    Alimenta os cards do Dashboard: Total de Máquinas, Ativas, Em Manutenção,
    Preventivas Vencidas, Preventivas Próximas, Custos do Mês.
    """
    sb = get_supabase()

    maquinas = sb.table("maquinas").select("id, situacao").execute().data
    total_maquinas = len(maquinas)
    ativas = sum(1 for m in maquinas if m["situacao"] == "ativa")
    em_manutencao = sum(1 for m in maquinas if m["situacao"] == "manutencao")

    hoje = date.today()
    inicio_mes = hoje.replace(day=1).isoformat()
    fim_mes = hoje.replace(day=monthrange(hoje.year, hoje.month)[1]).isoformat()

    custos_manutencao = (
        sb.table("manutencoes")
        .select("custo")
        .gte("data", inicio_mes)
        .lte("data", fim_mes)
        .execute()
        .data
    )
    custos_abastecimento = (
        sb.table("abastecimentos")
        .select("valor_total")
        .gte("data", inicio_mes)
        .lte("data", fim_mes)
        .execute()
        .data
    )
    custos_mes = sum(c["custo"] or 0 for c in custos_manutencao) + sum(
        a["valor_total"] or 0 for a in custos_abastecimento
    )

    # Preventivas: reaproveita a mesma lógica do router de preventivas
    from app.routers.preventivas import _calcular_status

    planos = sb.table("planos_preventiva").select("*").execute().data
    maquina_ids = list({p["maquina_id"] for p in planos})
    maquinas_leitura = (
        sb.table("maquinas").select("id, horimetro_atual, km_atual").in_("id", maquina_ids).execute().data
        if maquina_ids else []
    )
    maquinas_por_id = {m["id"]: m for m in maquinas_leitura}

    vencidas = 0
    proximas = 0
    for plano in planos:
        status = _calcular_status(plano, maquinas_por_id.get(plano["maquina_id"], {}))
        if status == "vencida":
            vencidas += 1
        elif status == "proxima":
            proximas += 1

    return {
        "total_maquinas": total_maquinas,
        "maquinas_ativas": ativas,
        "em_manutencao": em_manutencao,
        "preventivas_vencidas": vencidas,
        "preventivas_proximas": proximas,
        "custos_mes": round(custos_mes, 2),
    }


@router.get("/custos-por-mes")
def custos_por_mes(meses: int = 6):
    """Série temporal para o gráfico 'Custos ao Longo do Tempo (últimos N meses)'."""
    sb = get_supabase()

    hoje = date.today()
    marcos = []
    ano, mes = hoje.year, hoje.month
    for _ in range(meses):
        marcos.append((ano, mes))
        mes -= 1
        if mes == 0:
            mes = 12
            ano -= 1
    marcos.reverse()

    resultado = []
    for ano, mes in marcos:
        inicio = date(ano, mes, 1).isoformat()
        fim = date(ano, mes, monthrange(ano, mes)[1]).isoformat()

        manutencoes = (
            sb.table("manutencoes").select("custo").gte("data", inicio).lte("data", fim).execute().data
        )
        abastecimentos = (
            sb.table("abastecimentos").select("valor_total").gte("data", inicio).lte("data", fim).execute().data
        )
        total = sum(m["custo"] or 0 for m in manutencoes) + sum(a["valor_total"] or 0 for a in abastecimentos)

        resultado.append({"ano": ano, "mes": mes, "total": round(total, 2)})

    return resultado


@router.get("/custos-por-categoria")
def custos_por_categoria(meses: int = 6):
    """Alimenta o gráfico 'Custos por Categoria (últimos N meses)'."""
    sb = get_supabase()

    hoje = date.today()
    ano, mes = hoje.year, hoje.month
    for _ in range(meses - 1):
        mes -= 1
        if mes == 0:
            mes = 12
            ano -= 1
    inicio = date(ano, mes, 1).isoformat()

    manutencoes = sb.table("manutencoes").select("custo").gte("data", inicio).execute().data
    abastecimentos = sb.table("abastecimentos").select("valor_total").gte("data", inicio).execute().data

    return [
        {"categoria": "Manutenção", "total": round(sum(m["custo"] or 0 for m in manutencoes), 2)},
        {"categoria": "Combustível", "total": round(sum(a["valor_total"] or 0 for a in abastecimentos), 2)},
    ]
