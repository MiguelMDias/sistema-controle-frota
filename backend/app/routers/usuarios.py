from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth_deps import exigir_admin, UsuarioLogado
from app.auth_utils import hash_senha
from app.auditoria import registrar_log
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


def _sem_senha(registro: dict) -> dict:
    """Remove o hash de senha antes de guardar qualquer snapshot no log de auditoria."""
    return {k: v for k, v in registro.items() if k != "senha_hash"}


@router.post("", response_model=UsuarioOut, status_code=201)
def criar_usuario(payload: UsuarioCreate, admin: UsuarioLogado = Depends(exigir_admin)):
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
    registrar_log(admin, "criar", "usuario", criado["id"], f"Usuário {criado['nome']} ({criado['usuario']}) criado, papel: {criado['papel']}", dados_depois=_sem_senha(criado))
    return UsuarioOut(id=criado["id"], nome=criado["nome"], usuario=criado["usuario"], papel=criado["papel"], ativo=criado["ativo"])


@router.patch("/{usuario_id}", response_model=UsuarioOut)
def atualizar_usuario(usuario_id: int, payload: UsuarioUpdate, admin: UsuarioLogado = Depends(exigir_admin)):
    sb = get_supabase()
    dados = payload.model_dump(exclude_unset=True, exclude={"senha"})

    if payload.senha:
        dados["senha_hash"] = hash_senha(payload.senha)

    if not dados:
        raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualização")

    antes_resp = sb.table("usuarios").select("*").eq("id", usuario_id).execute()
    if not antes_resp.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    antes = antes_resp.data[0]

    resp = sb.table("usuarios").update(dados).eq("id", usuario_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    atualizado = resp.data[0]
    # nunca inclui a senha/hash no log -- só sinaliza que ela foi trocada
    campos_alterados = [c for c in payload.model_dump(exclude_unset=True).keys() if c != "senha"]
    if payload.senha:
        campos_alterados.append("senha (redefinida)")
    registrar_log(
        admin, "atualizar", "usuario", usuario_id,
        f"Usuário {atualizado['nome']} atualizado (campos: {', '.join(campos_alterados)})",
        dados_antes=_sem_senha(antes), dados_depois=_sem_senha(atualizado),
    )
    return UsuarioOut(
        id=atualizado["id"], nome=atualizado["nome"], usuario=atualizado["usuario"],
        papel=atualizado["papel"], ativo=atualizado["ativo"],
    )


@router.delete("/{usuario_id}", status_code=204)
def excluir_usuario(usuario_id: int, atual: UsuarioLogado = Depends(exigir_admin)):
    if usuario_id == atual.id:
        raise HTTPException(status_code=400, detail="Você não pode excluir seu próprio usuário")

    sb = get_supabase()
    existente = sb.table("usuarios").select("*").eq("id", usuario_id).execute()
    resp = sb.table("usuarios").delete().eq("id", usuario_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    nome = existente.data[0]["nome"] if existente.data else f"id={usuario_id}"
    registrar_log(atual, "excluir", "usuario", usuario_id, f"Usuário {nome} excluído", dados_antes=(_sem_senha(existente.data[0]) if existente.data else None))
