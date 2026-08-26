from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Header

from app.auth_utils import decodificar_token


class UsuarioLogado:
    def __init__(self, id: int, usuario: str, papel: str):
        self.id = id
        self.usuario = usuario
        self.papel = papel


def obter_usuario_atual(authorization: Optional[str] = Header(None)) -> UsuarioLogado:
    """
    Lê o header `Authorization: Bearer <token>`, valida o JWT e retorna o usuário logado.
    Usado como dependency em rotas que exigem estar autenticado.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Não autenticado")

    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decodificar_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada, faça login novamente")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

    return UsuarioLogado(id=int(payload["sub"]), usuario=payload["usuario"], papel=payload["papel"])


def exigir_admin(usuario: UsuarioLogado = Depends(obter_usuario_atual)) -> UsuarioLogado:
    """Dependency para rotas que só o papel 'admin' pode executar (ex: exclusões, gestão de usuários)."""
    if usuario.papel != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem realizar esta ação")
    return usuario


def exigir_operacional(usuario: UsuarioLogado = Depends(obter_usuario_atual)) -> UsuarioLogado:
    """
    Dependency para rotas de lançamento operacional (manutenção, abastecimento,
    nota fiscal, checklist, fornecedor). O papel 'diretor' é somente leitura
    -- não pode criar nem editar nada no sistema.
    """
    if usuario.papel == "diretor":
        raise HTTPException(status_code=403, detail="Diretores têm acesso somente para visualização")
    return usuario


def exigir_admin_ou_diretor(usuario: UsuarioLogado = Depends(obter_usuario_atual)) -> UsuarioLogado:
    """Dependency para módulos de gestão (Financeiro) -- admin e diretor têm acesso, mecânico não."""
    if usuario.papel not in ("admin", "diretor"):
        raise HTTPException(status_code=403, detail="Apenas administradores e diretores podem acessar este módulo")
    return usuario
