from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth_deps import exigir_admin, exigir_operacional, obter_usuario_atual, UsuarioLogado
from app.auditoria import registrar_log
from app.database import get_supabase
from app.maquina_guard import validar_maquina_permite_lancamento
from app.schemas.manutencoes import PlanoPreventiva, PlanoPreventivaCreate, PlanoPreventivaUpdate

router = APIRouter(prefix="/preventivas", tags=["Preventivas"])

# Janela de antecedência pra considerar uma preventiva "próxima" (ainda não vencida,
# mas perto o suficiente pra aparecer em destaque no dashboard/relatório).
DIAS_ANTECEDENCIA = 7
HORIMETRO_ANTECEDENCIA = 20
KM_ANTECEDENCIA = 500


def _calcular_status(plano: dict, maquina: dict) -> str:
    """
    Compara o plano contra a leitura atual da máquina e decide o status:
    vencida (já passou do limite), proxima (dentro da janela de antecedência) ou em_dia.
    Se o plano tiver mais de um critério (data + horímetro, por ex.), qualquer um
    vencido já marca a preventiva como vencida -- é o pior caso que importa pro gestor.
    """
    status = "em_dia"

    if plano.get("proxima_data"):
        proxima = date.fromisoformat(plano["proxima_data"])
        hoje = date.today()
        if proxima <= hoje:
            return "vencida"
        if proxima <= hoje + timedelta(days=DIAS_ANTECEDENCIA):
            status = "proxima"

    if plano.get("proximo_horimetro") is not None:
        atual = maquina.get("horimetro_atual") or 0
        limite = plano["proximo_horimetro"]
        if atual >= limite:
            return "vencida"
        if atual >= limite - HORIMETRO_ANTECEDENCIA:
            status = "proxima"

    if plano.get("proximo_km") is not None:
        atual = maquina.get("km_atual") or 0
        limite = plano["proximo_km"]
        if atual >= limite:
            return "vencida"
        if atual >= limite - KM_ANTECEDENCIA:
            status = "proxima"

    return status


def _enriquecer(plano: dict, maquinas_por_id: dict) -> dict:
    maquina = maquinas_por_id.get(plano["maquina_id"], {})
    plano["maquina_codigo"] = maquina.get("codigo")
    plano["status_calculado"] = _calcular_status(plano, maquina)
    return plano


@router.get("", response_model=list[PlanoPreventiva])
def listar_preventivas(
    maquina_id: Optional[int] = None,
    status: Optional[str] = None,
):
    """
    status aceita: vencida, proxima, em_dia -- calculado na hora, não é uma coluna do banco,
    porque depende da leitura atual da máquina (que muda a cada abastecimento/checklist).
    """
    sb = get_supabase()
    query = sb.table("planos_preventiva").select("*")
    if maquina_id:
        query = query.eq("maquina_id", maquina_id)
    planos = query.execute().data

    maquina_ids = list({p["maquina_id"] for p in planos})
    maquinas = (
        sb.table("maquinas").select("id, codigo, horimetro_atual, km_atual").in_("id", maquina_ids).execute().data
        if maquina_ids else []
    )
    maquinas_por_id = {m["id"]: m for m in maquinas}

    resultado = [_enriquecer(p, maquinas_por_id) for p in planos]

    if status:
        resultado = [p for p in resultado if p["status_calculado"] == status]

    return resultado


@router.post("", response_model=PlanoPreventiva, status_code=201)
def criar_preventiva(plano: PlanoPreventivaCreate, usuario: UsuarioLogado = Depends(exigir_operacional)):
    sb = get_supabase()

    validar_maquina_permite_lancamento(plano.maquina_id)

    maquina_resp = sb.table("maquinas").select("id, codigo, horimetro_atual, km_atual").eq("id", plano.maquina_id).execute()
    if not maquina_resp.data:
        raise HTTPException(status_code=422, detail="Máquina informada não existe")
    maquina = maquina_resp.data[0]

    dados = plano.model_dump(mode="json")
    if plano.intervalo_dias:
        dados["proxima_data"] = (date.today() + timedelta(days=plano.intervalo_dias)).isoformat()
    if plano.intervalo_horimetro:
        dados["proximo_horimetro"] = (maquina.get("horimetro_atual") or 0) + plano.intervalo_horimetro
    if plano.intervalo_km:
        dados["proximo_km"] = (maquina.get("km_atual") or 0) + plano.intervalo_km

    resp = sb.table("planos_preventiva").insert(dados).execute()
    criado = resp.data[0]
    registrar_log(usuario, "criar", "preventiva", criado["id"], f"Plano de preventiva criado para {maquina['codigo']}: {criado['descricao']}", dados_depois=criado)
    return _enriquecer(criado, {maquina["id"]: maquina})


@router.patch("/{plano_id}", response_model=PlanoPreventiva)
def atualizar_preventiva(plano_id: int, plano: PlanoPreventivaUpdate, usuario: UsuarioLogado = Depends(exigir_operacional)):
    sb = get_supabase()
    dados = plano.model_dump(mode="json", exclude_unset=True)
    if not dados:
        raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualização")

    antes_resp = sb.table("planos_preventiva").select("*").eq("id", plano_id).execute()
    if not antes_resp.data:
        raise HTTPException(status_code=404, detail="Plano de preventiva não encontrado")
    antes = antes_resp.data[0]

    resp = sb.table("planos_preventiva").update(dados).eq("id", plano_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Plano de preventiva não encontrado")

    atualizado = resp.data[0]
    maquina = sb.table("maquinas").select("id, codigo, horimetro_atual, km_atual").eq("id", atualizado["maquina_id"]).execute().data[0]
    registrar_log(usuario, "atualizar", "preventiva", plano_id, f"Plano de preventiva de {maquina['codigo']} atualizado", dados_antes=antes, dados_depois=atualizado)
    return _enriquecer(atualizado, {maquina["id"]: maquina})


@router.delete("/{plano_id}", status_code=204)
def excluir_preventiva(plano_id: int, usuario: UsuarioLogado = Depends(exigir_admin)):
    sb = get_supabase()
    existente = sb.table("planos_preventiva").select("*").eq("id", plano_id).execute()
    resp = sb.table("planos_preventiva").delete().eq("id", plano_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Plano de preventiva não encontrado")
    descricao = existente.data[0]["descricao"] if existente.data else f"id={plano_id}"
    registrar_log(usuario, "excluir", "preventiva", plano_id, f"Plano de preventiva excluído: {descricao}", dados_antes=(existente.data[0] if existente.data else None))


class ConcluirPreventivaPayload(BaseModel):
    data: date
    descricao: str
    fornecedor_id: Optional[int] = None
    horimetro: Optional[float] = None
    km: Optional[float] = None
    custo: Optional[float] = None


@router.post("/{plano_id}/concluir", response_model=PlanoPreventiva)
def concluir_preventiva(plano_id: int, payload: ConcluirPreventivaPayload, usuario: UsuarioLogado = Depends(exigir_operacional)):
    """
    Registra a execução da preventiva: cria o registro em `manutencoes` (histórico)
    e já recalcula a próxima data/horímetro/km do plano a partir dessa execução.
    É essa rota que o botão "Concluir" da tela de Preventivas deve chamar.
    """
    sb = get_supabase()

    plano_resp = sb.table("planos_preventiva").select("*").eq("id", plano_id).execute()
    if not plano_resp.data:
        raise HTTPException(status_code=404, detail="Plano de preventiva não encontrado")
    plano = plano_resp.data[0]

    validar_maquina_permite_lancamento(plano["maquina_id"])

    manutencao = sb.table("manutencoes").insert({
        "maquina_id": plano["maquina_id"],
        "fornecedor_id": payload.fornecedor_id,
        "data": payload.data.isoformat(),
        "tipo": "preventiva",
        "descricao": payload.descricao,
        "horimetro": payload.horimetro,
        "km": payload.km,
        "custo": payload.custo,
        "status": "concluida",
    }).execute().data[0]

    atualizacao = {"ultima_execucao_id": manutencao["id"]}
    if plano.get("intervalo_dias"):
        atualizacao["proxima_data"] = (payload.data + timedelta(days=plano["intervalo_dias"])).isoformat()
    if plano.get("intervalo_horimetro") and payload.horimetro is not None:
        atualizacao["proximo_horimetro"] = payload.horimetro + plano["intervalo_horimetro"]
    if plano.get("intervalo_km") and payload.km is not None:
        atualizacao["proximo_km"] = payload.km + plano["intervalo_km"]

    atualizado = sb.table("planos_preventiva").update(atualizacao).eq("id", plano_id).execute().data[0]
    maquina = sb.table("maquinas").select("id, codigo, horimetro_atual, km_atual").eq("id", plano["maquina_id"]).execute().data[0]
    registrar_log(usuario, "criar", "manutencao", manutencao["id"], f"Preventiva concluída em {maquina['codigo']}: {payload.descricao}")
    return _enriquecer(atualizado, {maquina["id"]: maquina})
