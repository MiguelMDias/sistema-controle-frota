from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth_deps import UsuarioLogado, obter_usuario_atual
from app.auth_utils import criar_token, hash_senha, verificar_senha
from app.auditoria import registrar_log
from app.database import get_supabase

router = APIRouter(prefix="/auth", tags=["Autenticação"])

MAX_TENTATIVAS = 5
BLOQUEIO_MINUTOS = 15


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
        # Mesma mensagem genérica de sempre -- não revela se o usuário existe ou não
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")

    usuario_db = resp.data[0]

    # Bloqueio por excesso de tentativas (proteção contra força bruta)
    bloqueado_ate = usuario_db.get("bloqueado_ate")
    if bloqueado_ate:
        expira = datetime.fromisoformat(bloqueado_ate.replace("Z", "+00:00"))
        if expira > datetime.now(timezone.utc):
            minutos_restantes = max(1, int((expira - datetime.now(timezone.utc)).total_seconds() // 60) + 1)
            raise HTTPException(
                status_code=429,
                detail=f"Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em {minutos_restantes} minuto(s).",
            )

    if not verificar_senha(payload.senha, usuario_db["senha_hash"]):
        tentativas = usuario_db.get("tentativas_falhas", 0) + 1
        atualizacao = {"tentativas_falhas": tentativas}
        if tentativas >= MAX_TENTATIVAS:
            atualizacao["bloqueado_ate"] = (datetime.now(timezone.utc) + timedelta(minutes=BLOQUEIO_MINUTOS)).isoformat()
            atualizacao["tentativas_falhas"] = 0
        sb.table("usuarios").update(atualizacao).eq("id", usuario_db["id"]).execute()
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")

    # Login certo -- zera qualquer contagem de tentativas anterior
    if usuario_db.get("tentativas_falhas", 0) > 0 or usuario_db.get("bloqueado_ate"):
        sb.table("usuarios").update({"tentativas_falhas": 0, "bloqueado_ate": None}).eq("id", usuario_db["id"]).execute()

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
    senha: str = Field(..., min_length=6, description="Mínimo 6 caracteres")


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
