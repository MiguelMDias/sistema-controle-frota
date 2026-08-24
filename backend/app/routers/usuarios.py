from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth_deps import exigir_admin, UsuarioLogado
from app.auth_utils import hash_senha
from app.database import get_supabase

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


class UsuarioOut(BaseModel):
    id: int
    nome: str
    usuario: str
    papel: str
    ativo: bool


class UsuarioCreate(BaseModel):
    nome: str
    usuario: str
    senha: str
    papel: str = "operador"


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    papel: Optional[str] = None
    ativo: Optional[bool] = None
    senha: Optional[str] = None  # se enviado, troca a senha


@router.get("", response_model=list[UsuarioOut])
def listar_usuarios(_: UsuarioLogado = Depends(exigir_admin)):
    sb = get_supabase()
    resp = sb.table("usuarios").select("id, nome, usuario, papel, ativo").order("nome").execute()
    return resp.data


@router.post("", response_model=UsuarioOut, status_code=201)
def criar_usuario(payload: UsuarioCreate, _: UsuarioLogado = Depends(exigir_admin)):
    sb = get_supabase()

    existe = sb.table("usuarios").select("id").eq("usuario", payload.usuario).execute()
    if existe.data:
        raise HTTPException(status_code=409, detail=f"Já existe um usuário com o código {payload.usuario}")

    dados = {
        "nome": payload.nome,
        "usuario": payload.usuario,
        "senha_hash": hash_senha(payload.senha),
        "papel": payload.papel,
    }
    resp = sb.table("usuarios").insert(dados).execute()
    criado = resp.data[0]
    return UsuarioOut(id=criado["id"], nome=criado["nome"], usuario=criado["usuario"], papel=criado["papel"], ativo=criado["ativo"])


@router.patch("/{usuario_id}", response_model=UsuarioOut)
def atualizar_usuario(usuario_id: int, payload: UsuarioUpdate, _: UsuarioLogado = Depends(exigir_admin)):
    sb = get_supabase()
    dados = payload.model_dump(exclude_unset=True, exclude={"senha"})

    if payload.senha:
        dados["senha_hash"] = hash_senha(payload.senha)

    if not dados:
        raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualização")

    resp = sb.table("usuarios").update(dados).eq("id", usuario_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    atualizado = resp.data[0]
    return UsuarioOut(
        id=atualizado["id"], nome=atualizado["nome"], usuario=atualizado["usuario"],
        papel=atualizado["papel"], ativo=atualizado["ativo"],
    )


@router.delete("/{usuario_id}", status_code=204)
def excluir_usuario(usuario_id: int, atual: UsuarioLogado = Depends(exigir_admin)):
    if usuario_id == atual.id:
        raise HTTPException(status_code=400, detail="Você não pode excluir seu próprio usuário")

    sb = get_supabase()
    resp = sb.table("usuarios").delete().eq("id", usuario_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
