from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth_deps import UsuarioLogado, obter_usuario_atual
from app.auth_utils import criar_token, hash_senha, verificar_senha
from app.auditoria import registrar_log
from app.database import get_supabase

router = APIRouter(prefix="/auth", tags=["Autenticação"])


class LoginPayload(BaseModel):
    usuario: str
    senha: str


class LoginResponse(BaseModel):
    token: str
    usuario: str
    nome: str
    papel: str


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginPayload):
    sb = get_supabase()
    resp = sb.table("usuarios").select("*").eq("usuario", payload.usuario).eq("ativo", True).execute()

    if not resp.data:
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")

    usuario_db = resp.data[0]
    if not verificar_senha(payload.senha, usuario_db["senha_hash"]):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")

    token = criar_token(usuario_db["id"], usuario_db["usuario"], usuario_db["papel"])
    return LoginResponse(
        token=token,
        usuario=usuario_db["usuario"],
        nome=usuario_db["nome"],
        papel=usuario_db["papel"],
    )


class MeResponse(BaseModel):
    id: int
    usuario: str
    papel: str


@router.get("/me", response_model=MeResponse)
def me(usuario: UsuarioLogado = Depends(obter_usuario_atual)):
    """Confirma se o token ainda é válido e devolve os dados do usuário logado."""
    return MeResponse(id=usuario.id, usuario=usuario.usuario, papel=usuario.papel)


class RegistroPayload(BaseModel):
    nome: str
    usuario: str
    senha: str


@router.post("/registrar", response_model=LoginResponse, status_code=201)
def registrar(payload: RegistroPayload):
    """
    Cadastro público de novo usuário. Sempre criado com papel 'mecanico',
    independente do que for enviado -- só um administrador pode promover
    alguém a admin depois, pela tela de Usuários.
    Já retorna o token de login, pra entrar direto após se cadastrar.
    """
    sb = get_supabase()

    existe = sb.table("usuarios").select("id").eq("usuario", payload.usuario).execute()
    if existe.data:
        raise HTTPException(status_code=409, detail=f"Já existe um usuário com o código {payload.usuario}")

    dados = {
        "nome": payload.nome,
        "usuario": payload.usuario,
        "senha_hash": hash_senha(payload.senha),
        "papel": "mecanico",
    }
    resp = sb.table("usuarios").insert(dados).execute()
    criado = resp.data[0]

    registrar_log(
        UsuarioLogado(id=criado["id"], usuario=criado["usuario"], papel=criado["papel"]),
        "criar", "usuario", criado["id"], f"Usuário {criado['nome']} ({criado['usuario']}) se auto-cadastrou",
    )

    token = criar_token(criado["id"], criado["usuario"], criado["papel"])
    return LoginResponse(token=token, usuario=criado["usuario"], nome=criado["nome"], papel=criado["papel"])
