from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth_deps import exigir_admin, UsuarioLogado
from app.database import get_supabase
from app.schemas.fornecedores import Fornecedor, FornecedorCreate, FornecedorUpdate

router = APIRouter(prefix="/fornecedores", tags=["Fornecedores"])


@router.get("", response_model=list[Fornecedor])
def listar_fornecedores(busca: Optional[str] = Query(None, description="Busca por nome")):
    sb = get_supabase()
    query = sb.table("fornecedores").select("*")
    if busca:
        query = query.ilike("nome", f"%{busca}%")
    resp = query.order("nome").execute()
    return resp.data


@router.post("", response_model=Fornecedor, status_code=201)
def criar_fornecedor(fornecedor: FornecedorCreate):
    sb = get_supabase()
    existe = sb.table("fornecedores").select("id").eq("cnpj", fornecedor.cnpj).execute()
    if existe.data:
        raise HTTPException(status_code=409, detail=f"Já existe um fornecedor com o CNPJ {fornecedor.cnpj}")
    resp = sb.table("fornecedores").insert(fornecedor.model_dump(mode="json")).execute()
    return resp.data[0]


@router.patch("/{fornecedor_id}", response_model=Fornecedor)
def atualizar_fornecedor(fornecedor_id: int, fornecedor: FornecedorUpdate):
    sb = get_supabase()
    dados = fornecedor.model_dump(mode="json", exclude_unset=True)
    if not dados:
        raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualização")
    resp = sb.table("fornecedores").update(dados).eq("id", fornecedor_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    return resp.data[0]


@router.delete("/{fornecedor_id}", status_code=204)
def excluir_fornecedor(fornecedor_id: int, _: UsuarioLogado = Depends(exigir_admin)):
    sb = get_supabase()
    resp = sb.table("fornecedores").delete().eq("id", fornecedor_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
