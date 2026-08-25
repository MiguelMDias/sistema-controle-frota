"""
Módulo Financeiro.

Diferente do Dashboard (que dá uma visão rápida em cards/gráficos), este
módulo é voltado à gestão de custos em si: tabelas detalhadas, comparações
e o cadastro de Centros de Despesa (que fica no router de máquinas, por já
ser usado lá, mas é consumido também pela tela de Financeiro).
"""

from calendar import monthrange
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.database import get_supabase

router = APIRouter(prefix="/financeiro", tags=["Financeiro"])


def _buscar_custos(sb, data_inicio: str, data_fim: str) -> list[dict]:
    """
    Retorna uma lista "achatada" de lançamentos de custo no período, cada um com:
    maquina_id (pode ser None), categoria (manutencao/abastecimento/nota_fiscal),
    valor, data, e -- só para notas sem máquina vinculada -- centro_despesa_id
    (o centro informado diretamente na nota).

    Notas fiscais vinculadas a mais de uma máquina têm o valor rateado
    igualmente entre elas.
    """
    manutencoes = (
        sb.table("manutencoes").select("maquina_id, data, custo")
        .gte("data", data_inicio).lte("data", data_fim).execute().data
    )
    abastecimentos = (
        sb.table("abastecimentos").select("maquina_id, data, valor_total")
        .gte("data", data_inicio).lte("data", data_fim).execute().data
    )
    notas = (
        sb.table("notas_fiscais")
        .select("id, data_emissao, valor_total, centro_despesa_id, notas_fiscais_maquinas(maquina_id)")
        .gte("data_emissao", data_inicio).lte("data_emissao", data_fim).execute().data
    )

    linhas = []
    for m in manutencoes:
        linhas.append({"maquina_id": m["maquina_id"], "categoria": "manutencao", "valor": m["custo"] or 0, "centro_despesa_id": None})
    for a in abastecimentos:
        linhas.append({"maquina_id": a["maquina_id"], "categoria": "abastecimento", "valor": a["valor_total"] or 0, "centro_despesa_id": None})
    for n in notas:
        vinculos = [v["maquina_id"] for v in (n.get("notas_fiscais_maquinas") or [])]
        valor = n["valor_total"] or 0
        if vinculos:
            rateio = valor / len(vinculos)
            for maquina_id in vinculos:
                linhas.append({"maquina_id": maquina_id, "categoria": "nota_fiscal", "valor": rateio, "centro_despesa_id": None})
        else:
            # nota sem máquina específica -- entra no total do centro de despesa próprio dela
            linhas.append({"maquina_id": None, "categoria": "nota_fiscal", "valor": valor, "centro_despesa_id": n["centro_despesa_id"]})

    return linhas


def _totais_vazios() -> dict:
    return {"manutencao": 0.0, "abastecimento": 0.0, "nota_fiscal": 0.0, "total": 0.0}


def _somar(destino: dict, linha: dict) -> None:
    destino[linha["categoria"]] += linha["valor"]
    destino["total"] += linha["valor"]


@router.get("/visao-geral")
def visao_geral(
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
):
    """
    Resumo compacto do período (não é um dashboard -- é o ponto de partida
    da tela de Financeiro, com os números que orientam qual sub-tela abrir).
    """
    sb = get_supabase()
    linhas = _buscar_custos(sb, data_inicio.isoformat(), data_fim.isoformat())

    totais = _totais_vazios()
    for linha in linhas:
        _somar(totais, linha)

    maquinas_ativas = (
        sb.table("maquinas").select("id", count="exact").in_("situacao", ["ativa", "manutencao"]).execute()
    )
    num_maquinas = maquinas_ativas.count or 0

    return {
        **totais,
        "num_maquinas_ativas": num_maquinas,
        "custo_medio_por_maquina": (totais["total"] / num_maquinas) if num_maquinas else 0,
    }


@router.get("/custo-por-maquina")
def custo_por_maquina(
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    centro_despesa_id: Optional[int] = None,
):
    sb = get_supabase()
    linhas = _buscar_custos(sb, data_inicio.isoformat(), data_fim.isoformat())

    maquinas = (
        sb.table("maquinas").select("id, codigo, tipo, centro_despesa_id, centros_despesa(nome)").execute().data
    )
    maquinas_por_id = {m["id"]: m for m in maquinas}

    agregados: dict = {}
    for linha in linhas:
        chave = linha["maquina_id"]
        if chave not in agregados:
            agregados[chave] = _totais_vazios()
        _somar(agregados[chave], linha)

    resultado = []
    for maquina_id, totais in agregados.items():
        if maquina_id is None:
            resultado.append({
                "maquina_id": None,
                "codigo": "(Sem máquina vinculada)",
                "tipo": None,
                "centro_despesa_nome": None,
                **totais,
            })
            continue

        maquina = maquinas_por_id.get(maquina_id)
        if not maquina:
            continue
        if centro_despesa_id and maquina["centro_despesa_id"] != centro_despesa_id:
            continue

        resultado.append({
            "maquina_id": maquina_id,
            "codigo": maquina["codigo"],
            "tipo": maquina["tipo"],
            "centro_despesa_nome": (maquina.get("centros_despesa") or {}).get("nome"),
            **totais,
        })

    resultado.sort(key=lambda r: r["total"], reverse=True)
    return resultado


@router.get("/custo-por-mes")
def custo_por_mes(ano: int = Query(..., ge=1980, le=2100)):
    sb = get_supabase()
    linhas_por_mes = []
    for mes in range(1, 13):
        inicio = date(ano, mes, 1).isoformat()
        fim = date(ano, mes, monthrange(ano, mes)[1]).isoformat()
        linhas = _buscar_custos(sb, inicio, fim)
        totais = _totais_vazios()
        for linha in linhas:
            _somar(totais, linha)
        linhas_por_mes.append({"mes": mes, **totais})
    return linhas_por_mes


@router.get("/comparacao-periodos")
def comparacao_periodos(
    inicio_a: date = Query(...),
    fim_a: date = Query(...),
    inicio_b: date = Query(...),
    fim_b: date = Query(...),
):
    if inicio_a > fim_a or inicio_b > fim_b:
        raise HTTPException(status_code=422, detail="Data de início não pode ser depois da data de fim em nenhum dos dois períodos.")

    sb = get_supabase()

    totais_a = _totais_vazios()
    for linha in _buscar_custos(sb, inicio_a.isoformat(), fim_a.isoformat()):
        _somar(totais_a, linha)

    totais_b = _totais_vazios()
    for linha in _buscar_custos(sb, inicio_b.isoformat(), fim_b.isoformat()):
        _somar(totais_b, linha)

    variacao = None
    if totais_a["total"] > 0:
        variacao = ((totais_b["total"] - totais_a["total"]) / totais_a["total"]) * 100

    return {"periodo_a": totais_a, "periodo_b": totais_b, "variacao_percentual": variacao}


@router.get("/comparacao-centros")
def comparacao_centros(
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
):
    sb = get_supabase()
    linhas = _buscar_custos(sb, data_inicio.isoformat(), data_fim.isoformat())

    maquinas = sb.table("maquinas").select("id, centro_despesa_id").execute().data
    centro_por_maquina = {m["id"]: m["centro_despesa_id"] for m in maquinas}

    centros = sb.table("centros_despesa").select("id, nome").execute().data
    nome_por_centro = {c["id"]: c["nome"] for c in centros}

    agregados: dict = {}
    for linha in linhas:
        if linha["maquina_id"] is not None:
            centro_id = centro_por_maquina.get(linha["maquina_id"])
        else:
            centro_id = linha["centro_despesa_id"]

        if centro_id not in agregados:
            agregados[centro_id] = _totais_vazios()
        _somar(agregados[centro_id], linha)

    resultado = []
    for centro_id, totais in agregados.items():
        resultado.append({
            "centro_despesa_id": centro_id,
            "nome": nome_por_centro.get(centro_id, "(Sem centro de despesa)"),
            **totais,
        })
    resultado.sort(key=lambda r: r["total"], reverse=True)
    return resultado
