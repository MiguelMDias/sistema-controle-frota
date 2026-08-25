from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth_deps import exigir_admin, UsuarioLogado
from app.database import get_supabase
from app.maquina_guard import validar_maquina_permite_lancamento
from app.schemas.manutencoes import Manutencao, ManutencaoCreate, ManutencaoUpdate

router = APIRouter(prefix="/manutencoes", tags=["Manutenções"])

# Faz join com maquinas/fornecedores pra já trazer código/nome prontos pra tabela do front,
# sem o React precisar cruzar as três listas na mão.
SELECT_COM_JOIN = "*, maquinas(codigo), fornecedores(nome)"


def _achatar(registro: dict) -> dict:
    """Transforma o retorno aninhado do Supabase (maquinas: {codigo: ...}) em campos planos."""
    maquina = registro.pop("maquinas", None) or {}
    fornecedor = registro.pop("fornecedores", None) or {}
    registro["maquina_codigo"] = maquina.get("codigo")
    registro["fornecedor_nome"] = fornecedor.get("nome")
    return registro


@router.get("", response_model=list[Manutencao])
def listar_manutencoes(
    maquina_id: Optional[int] = None,
    tipo: Optional[str] = None,
    status: Optional[str] = None,
):
    sb = get_supabase()
    query = sb.table("manutencoes").select(SELECT_COM_JOIN)

    if maquina_id:
        query = query.eq("maquina_id", maquina_id)
    if tipo:
        query = query.eq("tipo", tipo)
    if status:
        query = query.eq("status", status)

    resp = query.order("data", desc=True).execute()
    return [_achatar(r) for r in resp.data]


@router.get("/{manutencao_id}", response_model=Manutencao)
def obter_manutencao(manutencao_id: int):
    sb = get_supabase()
    resp = sb.table("manutencoes").select(SELECT_COM_JOIN).eq("id", manutencao_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Manutenção não encontrada")
    return _achatar(resp.data[0])


@router.post("", response_model=Manutencao, status_code=201)
def criar_manutencao(manutencao: ManutencaoCreate):
    sb = get_supabase()

    validar_maquina_permite_lancamento(manutencao.maquina_id)

    resp = (
        sb.table("manutencoes")
        .insert(manutencao.model_dump(mode="json"))
        .execute()
    )
    criada = sb.table("manutencoes").select(SELECT_COM_JOIN).eq("id", resp.data[0]["id"]).execute()
    return _achatar(criada.data[0])
    # obs: horimetro_atual/km_atual da máquina são atualizados automaticamente
    # pelo trigger trg_manutencoes_atualiza_leitura no banco


@router.patch("/{manutencao_id}", response_model=Manutencao)
def atualizar_manutencao(manutencao_id: int, manutencao: ManutencaoUpdate):
    sb = get_supabase()
    dados = manutencao.model_dump(mode="json", exclude_unset=True)
    if not dados:
        raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualização")

    existente = sb.table("manutencoes").select("maquina_id").eq("id", manutencao_id).execute()
    if not existente.data:
        raise HTTPException(status_code=404, detail="Manutenção não encontrada")
    validar_maquina_permite_lancamento(manutencao.maquina_id or existente.data[0]["maquina_id"])

    resp = sb.table("manutencoes").update(dados).eq("id", manutencao_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Manutenção não encontrada")

    atualizada = sb.table("manutencoes").select(SELECT_COM_JOIN).eq("id", manutencao_id).execute()
    return _achatar(atualizada.data[0])


@router.delete("/{manutencao_id}", status_code=204)
def excluir_manutencao(manutencao_id: int, _: UsuarioLogado = Depends(exigir_admin)):
    sb = get_supabase()
    resp = sb.table("manutencoes").delete().eq("id", manutencao_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Manutenção não encontrada")
