from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth_deps import exigir_admin, UsuarioLogado
from app.database import get_supabase
from app.schemas.maquinas import Maquina, MaquinaCreate, MaquinaUpdate

router = APIRouter(prefix="/maquinas", tags=["Máquinas"])


@router.get("", response_model=list[Maquina])
def listar_maquinas(
    tipo: Optional[str] = None,
    situacao: Optional[str] = None,
    centro_custo: Optional[str] = None,
    busca: Optional[str] = Query(None, description="Busca por código, nº patrimonial, marca ou modelo"),
):
    """Lista máquinas com os mesmos filtros da tela (Tipo, Situação, Centro de Custo, Pesquisar)."""
    sb = get_supabase()
    query = sb.table("maquinas").select("*")

    if tipo:
        query = query.eq("tipo", tipo)
    if situacao:
        query = query.eq("situacao", situacao)
    if centro_custo:
        query = query.eq("centro_custo", centro_custo)
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

    resp = sb.table("maquinas").insert(maquina.model_dump(mode="json")).execute()
    return resp.data[0]


@router.patch("/{maquina_id}", response_model=Maquina)
def atualizar_maquina(maquina_id: int, maquina: MaquinaUpdate):
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
    sb = get_supabase()
    resp = sb.table("maquinas").delete().eq("id", maquina_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Máquina não encontrada")
