"""
Log de auditoria: registra quem fez o quê no sistema, para rastreabilidade.

Chamado a partir dos routers, após uma operação de escrita (criar/atualizar/
excluir/etc) ter sido concluída com sucesso. Nunca deve derrubar a operação
principal -- se o registro do log falhar por qualquer motivo, o erro é
engolido e apenas registrado no console do servidor.

dados_antes/dados_depois guardam um retrato (snapshot) do registro antes e
depois da alteração, usados pela tela de detalhe do log para mostrar
"o que mudou" campo a campo. Nunca inclua campos sensíveis (senha_hash) --
o chamador é responsável por excluir esses campos antes de passar aqui.
"""

from app.auth_deps import UsuarioLogado
from app.database import get_supabase


def registrar_log(
    usuario: UsuarioLogado,
    acao: str,
    entidade: str,
    entidade_id: int | None,
    descricao: str,
    dados_antes: dict | None = None,
    dados_depois: dict | None = None,
) -> None:
    try:
        sb = get_supabase()
        sb.table("logs_auditoria").insert({
            "usuario_id": usuario.id,
            "usuario_nome": usuario.usuario,
            "acao": acao,
            "entidade": entidade,
            "entidade_id": entidade_id,
            "descricao": descricao,
            "dados_antes": dados_antes,
            "dados_depois": dados_depois,
        }).execute()
    except Exception as exc:  # nunca deixa o log quebrar a ação principal
        print(f"[auditoria] falha ao registrar log ({entidade}/{acao}): {exc}")
