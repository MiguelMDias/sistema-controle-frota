from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.auth_deps import exigir_admin, UsuarioLogado
from app.database import get_supabase
from app.maquina_guard import validar_maquina_permite_lancamento
from app.schemas.checklist import (
    ChecklistModelo,
    ChecklistModeloCreate,
    ChecklistExecucao,
    ChecklistExecucaoCreate,
)

router = APIRouter(prefix="/checklist", tags=["Checklist"])


# ---------- Modelos ----------

@router.get("/modelos", response_model=list[ChecklistModelo])
def listar_modelos(tipo_maquina: Optional[str] = None):
    sb = get_supabase()
    query = sb.table("checklist_modelos").select("*")
    if tipo_maquina:
        query = query.eq("tipo_maquina", tipo_maquina)
    resp = query.order("nome").execute()
    return resp.data


@router.post("/modelos", response_model=ChecklistModelo, status_code=201)
def criar_modelo(modelo: ChecklistModeloCreate):
    sb = get_supabase()
    dados = modelo.model_dump(mode="json")
    resp = sb.table("checklist_modelos").insert(dados).execute()
    return resp.data[0]


@router.delete("/modelos/{modelo_id}", status_code=204)
def excluir_modelo(modelo_id: int, _: UsuarioLogado = Depends(exigir_admin)):
    sb = get_supabase()
    resp = sb.table("checklist_modelos").delete().eq("id", modelo_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Modelo de checklist não encontrado")


# ---------- Execuções ----------

SELECT_COM_JOIN = "*, maquinas(codigo)"


def _achatar(registro: dict) -> dict:
    maquina = registro.pop("maquinas", None) or {}
    registro["maquina_codigo"] = maquina.get("codigo")
    return registro


@router.get("/execucoes", response_model=list[ChecklistExecucao])
def listar_execucoes(
    maquina_id: Optional[int] = None,
    apenas_com_pendencia: bool = False,
):
    sb = get_supabase()
    query = sb.table("checklist_execucoes").select(SELECT_COM_JOIN)
    if maquina_id:
        query = query.eq("maquina_id", maquina_id)
    if apenas_com_pendencia:
        query = query.eq("tem_pendencia", True)
    resp = query.order("data", desc=True).execute()
    return [_achatar(r) for r in resp.data]


@router.post("/execucoes", response_model=ChecklistExecucao, status_code=201)
def registrar_execucao(execucao: ChecklistExecucaoCreate):
    sb = get_supabase()

    validar_maquina_permite_lancamento(execucao.maquina_id)

    tem_pendencia = any(not r.ok for r in execucao.respostas)

    dados = execucao.model_dump(mode="json")
    dados["tem_pendencia"] = tem_pendencia

    resp = sb.table("checklist_execucoes").insert(dados).execute()
    criada = sb.table("checklist_execucoes").select(SELECT_COM_JOIN).eq("id", resp.data[0]["id"]).execute()
    return _achatar(criada.data[0])
    # horimetro_atual/km_atual são atualizados automaticamente pelo trigger no banco
