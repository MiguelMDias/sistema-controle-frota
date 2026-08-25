from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.auth_deps import exigir_admin, UsuarioLogado
from app.database import get_supabase

router = APIRouter(prefix="/logs", tags=["Central de Logs"])

ENTIDADES = [
    "maquina", "centro_despesa", "fornecedor", "manutencao", "preventiva",
    "abastecimento", "nota_fiscal", "checklist_execucao", "usuario",
]
ACOES = ["criar", "atualizar", "excluir", "excluir_permanente", "ativar", "desativar"]


@router.get("")
def listar_logs(
    entidade: Optional[str] = None,
    acao: Optional[str] = None,
    usuario_id: Optional[int] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    busca: Optional[str] = Query(None, description="Busca por texto na descrição"),
    limite: int = Query(200, ge=1, le=1000),
    _: UsuarioLogado = Depends(exigir_admin),
):
    """Lista o histórico de ações do sistema -- somente administradores."""
    sb = get_supabase()
    query = sb.table("logs_auditoria").select("*")

    if entidade:
        query = query.eq("entidade", entidade)
    if acao:
        query = query.eq("acao", acao)
    if usuario_id:
        query = query.eq("usuario_id", usuario_id)
    if data_inicio:
        query = query.gte("created_at", data_inicio.isoformat())
    if data_fim:
        # inclui o dia inteiro de data_fim
        query = query.lt("created_at", (data_fim + timedelta(days=1)).isoformat())
    if busca:
        query = query.ilike("descricao", f"%{busca}%")

    resp = query.order("created_at", desc=True).limit(limite).execute()
    return resp.data


@router.get("/usuarios-ativos")
def listar_usuarios_com_log(_: UsuarioLogado = Depends(exigir_admin)):
    """Lista os usuários distintos que aparecem no log, para popular o filtro por usuário."""
    sb = get_supabase()
    resp = sb.table("logs_auditoria").select("usuario_id, usuario_nome").execute()
    vistos = {}
    for linha in resp.data:
        if linha["usuario_id"] is not None:
            vistos[linha["usuario_id"]] = linha["usuario_nome"]
    return [{"id": uid, "nome": nome} for uid, nome in sorted(vistos.items(), key=lambda x: x[1])]
