from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth_deps import exigir_admin, UsuarioLogado
from app.database import get_supabase
from app.schemas.maquinas import (
    CentroDespesa,
    CentroDespesaCreate,
    Maquina,
    MaquinaCreate,
    MaquinaUpdate,
)

router = APIRouter(prefix="/maquinas", tags=["Máquinas"])


@router.get("", response_model=list[Maquina])
def listar_maquinas(
    tipo: Optional[str] = None,
    situacao: Optional[str] = None,
    centro_despesa_id: Optional[int] = None,
    busca: Optional[str] = Query(None, description="Busca por código, nº patrimonial, marca ou modelo"),
    apenas_disponiveis: bool = Query(
        False,
        description="Se true, retorna só máquinas 'ativa' ou 'manutencao' -- uso nos seletores de "
        "abastecimento/manutenção/nota fiscal/checklist, que não aceitam máquinas inativas/baixadas.",
    ),
):
    """Lista máquinas com os mesmos filtros da tela (Tipo, Situação, Centro de Despesa, Pesquisar)."""
    sb = get_supabase()
    query = sb.table("maquinas").select("*")

    if tipo:
        query = query.eq("tipo", tipo)
    if situacao:
        query = query.eq("situacao", situacao)
    if apenas_disponiveis:
        query = query.in_("situacao", ["ativa", "manutencao"])
    if centro_despesa_id:
        query = query.eq("centro_despesa_id", centro_despesa_id)
    if busca:
        # or_ do PostgREST para buscar em várias colunas de uma vez
        termo = f"%{busca}%"
        query = query.or_(
            f"codigo.ilike.{termo},numero_patrimonial.ilike.{termo},"
            f"marca.ilike.{termo},modelo.ilike.{termo}"
        )

    resp = query.order("codigo").execute()
    return resp.data


@router.get("/{maquina_id}", response_model=Maquina)
def obter_maquina(maquina_id: int):
    sb = get_supabase()
    resp = sb.table("maquinas").select("*").eq("id", maquina_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Máquina não encontrada")
    return resp.data[0]


@router.post("", response_model=Maquina, status_code=201)
def criar_maquina(maquina: MaquinaCreate):
    sb = get_supabase()
    # unicidade de código tratada pela constraint UNIQUE do banco;
    # aqui só traduzimos o erro pro usuário
    existe = sb.table("maquinas").select("id").eq("codigo", maquina.codigo).execute()
    if existe.data:
        raise HTTPException(status_code=409, detail=f"Já existe uma máquina com o código {maquina.codigo}")

    if maquina.numero_patrimonial:
        existe_pat = (
            sb.table("maquinas")
            .select("id")
            .eq("numero_patrimonial", maquina.numero_patrimonial)
            .execute()
        )
        if existe_pat.data:
            raise HTTPException(
                status_code=409,
                detail=f"Já existe uma máquina com o nº patrimonial {maquina.numero_patrimonial}",
            )

    resp = sb.table("maquinas").insert(maquina.model_dump(mode="json")).execute()
    return resp.data[0]


@router.patch("/{maquina_id}", response_model=Maquina)
def atualizar_maquina(
    maquina_id: int,
    maquina: MaquinaUpdate,
    _: UsuarioLogado = Depends(exigir_admin),
):
    """Alterar máquina -- restrito a administradores."""
    sb = get_supabase()
    dados = maquina.model_dump(mode="json", exclude_unset=True)
    if not dados:
        raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualização")

    resp = sb.table("maquinas").update(dados).eq("id", maquina_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Máquina não encontrada")
    return resp.data[0]


@router.delete("/{maquina_id}", status_code=204)
def excluir_maquina(maquina_id: int, _: UsuarioLogado = Depends(exigir_admin)):
    """
    Exclusão padrão (soft delete): marca a máquina como 'inativa' em vez de
    apagar o registro, preservando o histórico vinculado (manutenções,
    abastecimentos, notas fiscais, checklists).
    """
    sb = get_supabase()
    resp = (
        sb.table("maquinas")
        .update({"situacao": "inativa"})
        .eq("id", maquina_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Máquina não encontrada")


@router.delete("/{maquina_id}/permanente", status_code=204)
def excluir_maquina_permanente(maquina_id: int, _: UsuarioLogado = Depends(exigir_admin)):
    """
    Exclusão definitiva (hard delete): remove o registro do banco de vez.
    Uso recomendado apenas para limpeza de dados de teste/fictícios --
    falha se houver histórico vinculado (manutenção, abastecimento, nota
    fiscal ou checklist), já que essa relação seria perdida.
    """
    sb = get_supabase()
    try:
        resp = sb.table("maquinas").delete().eq("id", maquina_id).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=409,
            detail="Não é possível excluir: existem registros vinculados a esta máquina "
            "(manutenção, abastecimento, nota fiscal ou checklist).",
        ) from exc
    if not resp.data:
        raise HTTPException(status_code=404, detail="Máquina não encontrada")


@router.get("/centros-despesa/listar", response_model=list[CentroDespesa])
def listar_centros_despesa(incluir_inativos: bool = False):
    sb = get_supabase()
    query = sb.table("centros_despesa").select("*")
    if not incluir_inativos:
        query = query.eq("ativo", True)
    resp = query.order("nome").execute()
    return resp.data


@router.post("/centros-despesa/listar", response_model=CentroDespesa, status_code=201)
def criar_centro_despesa(centro: CentroDespesaCreate, _: UsuarioLogado = Depends(exigir_admin)):
    sb = get_supabase()
    existe = sb.table("centros_despesa").select("id").eq("nome", centro.nome).execute()
    if existe.data:
        raise HTTPException(status_code=409, detail=f"Já existe um centro de despesa '{centro.nome}'")
    resp = sb.table("centros_despesa").insert(centro.model_dump()).execute()
    return resp.data[0]


@router.patch("/centros-despesa/{centro_id}", response_model=CentroDespesa)
def atualizar_centro_despesa(centro_id: int, centro: CentroDespesaCreate, _: UsuarioLogado = Depends(exigir_admin)):
    sb = get_supabase()
    existe = sb.table("centros_despesa").select("id").eq("id", centro_id).execute()
    if not existe.data:
        raise HTTPException(status_code=404, detail="Centro de despesa não encontrado")
    duplicado = sb.table("centros_despesa").select("id").eq("nome", centro.nome).neq("id", centro_id).execute()
    if duplicado.data:
        raise HTTPException(status_code=409, detail=f"Já existe um centro de despesa '{centro.nome}'")
    resp = sb.table("centros_despesa").update({"nome": centro.nome}).eq("id", centro_id).execute()
    return resp.data[0]


@router.patch("/centros-despesa/{centro_id}/situacao", response_model=CentroDespesa)
def alternar_situacao_centro_despesa(centro_id: int, ativo: bool, _: UsuarioLogado = Depends(exigir_admin)):
    """Ativa ou desativa um centro de despesa (soft delete -- preserva o histórico de custos já lançados)."""
    sb = get_supabase()
    resp = sb.table("centros_despesa").update({"ativo": ativo}).eq("id", centro_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Centro de despesa não encontrado")
    return resp.data[0]
