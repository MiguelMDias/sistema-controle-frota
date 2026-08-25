from calendar import monthrange
from datetime import date, timedelta

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


LABEL_SITUACAO = {"ativa": "Ativa", "manutencao": "Em Manutenção", "inativa": "Inativa", "baixada": "Baixada"}
LABEL_TIPO = {
    "carro": "Carro", "trator": "Trator",
    "empilhadeira_gas": "Empilhadeira a Gás", "empilhadeira_eletrica": "Empilhadeira Elétrica",
}


@router.get("/frota-por-situacao")
def frota_por_situacao():
    """Composição da frota por situação -- alimenta o gráfico de pizza do Dashboard."""
    sb = get_supabase()
    maquinas = sb.table("maquinas").select("situacao").execute().data
    contagem = {}
    for m in maquinas:
        contagem[m["situacao"]] = contagem.get(m["situacao"], 0) + 1
    return [{"situacao": s, "label": LABEL_SITUACAO.get(s, s), "total": t} for s, t in contagem.items()]


@router.get("/frota-por-tipo")
def frota_por_tipo():
    """Composição da frota por tipo de máquina -- alimenta o segundo gráfico de pizza."""
    sb = get_supabase()
    maquinas = sb.table("maquinas").select("tipo").execute().data
    contagem = {}
    for m in maquinas:
        contagem[m["tipo"]] = contagem.get(m["tipo"], 0) + 1
    return [{"tipo": t, "label": LABEL_TIPO.get(t, t), "total": q} for t, q in contagem.items()]


@router.get("/alertas")
def alertas_operacionais(limite: int = 8):
    """
    Lista unificada do que precisa de atenção agora, com a máquina específica:
    preventivas vencidas/próximas, manutenções em andamento e checklists com
    pendência nos últimos 7 dias. Ordenada por severidade (vencida primeiro).
    """
    sb = get_supabase()
    alertas = []

    # --- Preventivas vencidas/próximas ---
    from app.routers.preventivas import _calcular_status

    planos = sb.table("planos_preventiva").select("*").execute().data
    maquina_ids = list({p["maquina_id"] for p in planos})
    maquinas_leitura = (
        sb.table("maquinas").select("id, codigo, horimetro_atual, km_atual").in_("id", maquina_ids).execute().data
        if maquina_ids else []
    )
    maquinas_por_id = {m["id"]: m for m in maquinas_leitura}

    for plano in planos:
        maquina = maquinas_por_id.get(plano["maquina_id"], {})
        status = _calcular_status(plano, maquina)
        if status == "vencida":
            alertas.append({
                "severidade": "alta", "tipo": "preventiva_vencida",
                "maquina_codigo": maquina.get("codigo", "?"),
                "descricao": f"Preventiva vencida: {plano['descricao']}",
            })
        elif status == "proxima":
            alertas.append({
                "severidade": "media", "tipo": "preventiva_proxima",
                "maquina_codigo": maquina.get("codigo", "?"),
                "descricao": f"Preventiva próxima do vencimento: {plano['descricao']}",
            })

    # --- Manutenções em andamento ---
    manutencoes_abertas = (
        sb.table("manutencoes")
        .select("id, data, descricao, maquinas(codigo)")
        .eq("status", "em_andamento")
        .execute()
        .data
    )
    hoje = date.today()
    for m in manutencoes_abertas:
        dias_aberta = (hoje - date.fromisoformat(m["data"])).days
        alertas.append({
            "severidade": "media" if dias_aberta < 7 else "alta",
            "tipo": "manutencao_em_andamento",
            "maquina_codigo": (m.get("maquinas") or {}).get("codigo", "?"),
            "descricao": f"Manutenção em andamento há {dias_aberta} dia(s): {m['descricao']}",
        })

    # --- Checklists com pendência nos últimos 7 dias ---
    data_limite = (hoje - timedelta(days=7)).isoformat()
    checklists_pendencia = (
        sb.table("checklist_execucoes")
        .select("id, data, maquinas(codigo)")
        .eq("tem_pendencia", True)
        .gte("data", data_limite)
        .order("data", desc=True)
        .execute()
        .data
    )
    for c in checklists_pendencia:
        alertas.append({
            "severidade": "media",
            "tipo": "checklist_pendencia",
            "maquina_codigo": (c.get("maquinas") or {}).get("codigo", "?"),
            "descricao": f"Checklist com pendência em {date.fromisoformat(c['data'][:10]).strftime('%d/%m')}",
        })

    ordem_severidade = {"alta": 0, "media": 1, "baixa": 2}
    alertas.sort(key=lambda a: ordem_severidade.get(a["severidade"], 3))
    return alertas[:limite]


@router.get("/top-custos-maquinas")
def top_custos_maquinas(limite: int = 5):
    """Top N máquinas por custo total no mês atual -- resumo rápido; o detalhamento completo fica no módulo Financeiro."""
    sb = get_supabase()
    hoje = date.today()
    inicio_mes = hoje.replace(day=1).isoformat()
    fim_mes = hoje.replace(day=monthrange(hoje.year, hoje.month)[1]).isoformat()

    from app.routers.financeiro import _buscar_custos

    linhas = _buscar_custos(sb, inicio_mes, fim_mes)
    maquinas = sb.table("maquinas").select("id, codigo").execute().data
    codigo_por_id = {m["id"]: m["codigo"] for m in maquinas}

    totais = {}
    for linha in linhas:
        if linha["maquina_id"] is None:
            continue
        totais[linha["maquina_id"]] = totais.get(linha["maquina_id"], 0) + linha["valor"]

    resultado = [
        {"maquina_id": mid, "codigo": codigo_por_id.get(mid, "?"), "total": round(total, 2)}
        for mid, total in totais.items()
    ]
    resultado.sort(key=lambda r: r["total"], reverse=True)
    return resultado[:limite]
