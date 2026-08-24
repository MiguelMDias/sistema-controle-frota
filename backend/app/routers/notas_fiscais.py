from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.auth_deps import exigir_admin, UsuarioLogado
from app.database import get_supabase
from app.schemas.notas_fiscais import NotaFiscal, NotaFiscalCreate, NotaFiscalUpdate

router = APIRouter(prefix="/notas-fiscais", tags=["Notas Fiscais"])

SELECT_COM_JOIN = "*, fornecedores(nome), notas_fiscais_maquinas(maquinas(codigo))"


def _achatar(registro: dict) -> dict:
    fornecedor = registro.pop("fornecedores", None) or {}
    vinculos = registro.pop("notas_fiscais_maquinas", None) or []
    registro["fornecedor_nome"] = fornecedor.get("nome")
    registro["maquinas"] = [
        v["maquinas"]["codigo"] for v in vinculos if v.get("maquinas")
    ]
    return registro


@router.get("", response_model=list[NotaFiscal])
def listar_notas_fiscais(
    tipo: Optional[str] = None,
    maquina_id: Optional[int] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    busca: Optional[str] = None,
):
    """Filtros equivalentes à tela: Pesquisar, Tipo, Máquina, Período de/até."""
    sb = get_supabase()

    if maquina_id:
        # filtra pelas notas vinculadas a essa máquina específica via tabela de junção
        vinculos = sb.table("notas_fiscais_maquinas").select("nota_fiscal_id").eq("maquina_id", maquina_id).execute()
        ids = [v["nota_fiscal_id"] for v in vinculos.data]
        if not ids:
            return []
        query = sb.table("notas_fiscais").select(SELECT_COM_JOIN).in_("id", ids)
    else:
        query = sb.table("notas_fiscais").select(SELECT_COM_JOIN)

    if tipo:
        query = query.eq("tipo", tipo)
    if data_inicio:
        query = query.gte("data_emissao", data_inicio.isoformat())
    if data_fim:
        query = query.lte("data_emissao", data_fim.isoformat())
    if busca:
        query = query.ilike("numero", f"%{busca}%")

    resp = query.order("data_emissao", desc=True).execute()
    return [_achatar(r) for r in resp.data]


@router.post("", response_model=NotaFiscal, status_code=201)
def criar_nota_fiscal(nota: NotaFiscalCreate):
    sb = get_supabase()

    dados = nota.model_dump(mode="json", exclude={"maquina_ids"})
    resp = sb.table("notas_fiscais").insert(dados).execute()
    nota_id = resp.data[0]["id"]

    if nota.maquina_ids:
        vinculos = [{"nota_fiscal_id": nota_id, "maquina_id": mid} for mid in nota.maquina_ids]
        sb.table("notas_fiscais_maquinas").insert(vinculos).execute()

    criada = sb.table("notas_fiscais").select(SELECT_COM_JOIN).eq("id", nota_id).execute()
    return _achatar(criada.data[0])


@router.patch("/{nota_id}", response_model=NotaFiscal)
def atualizar_nota_fiscal(nota_id: int, nota: NotaFiscalUpdate):
    sb = get_supabase()
    dados = nota.model_dump(mode="json", exclude_unset=True, exclude={"maquina_ids"})

    if dados:
        resp = sb.table("notas_fiscais").update(dados).eq("id", nota_id).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Nota fiscal não encontrada")

    if nota.maquina_ids is not None:
        # substitui os vínculos: apaga os antigos e recria com a lista nova
        sb.table("notas_fiscais_maquinas").delete().eq("nota_fiscal_id", nota_id).execute()
        if nota.maquina_ids:
            vinculos = [{"nota_fiscal_id": nota_id, "maquina_id": mid} for mid in nota.maquina_ids]
            sb.table("notas_fiscais_maquinas").insert(vinculos).execute()

    atualizada = sb.table("notas_fiscais").select(SELECT_COM_JOIN).eq("id", nota_id).execute()
    if not atualizada.data:
        raise HTTPException(status_code=404, detail="Nota fiscal não encontrada")
    return _achatar(atualizada.data[0])


@router.delete("/{nota_id}", status_code=204)
def excluir_nota_fiscal(nota_id: int, _: UsuarioLogado = Depends(exigir_admin)):
    sb = get_supabase()
    resp = sb.table("notas_fiscais").delete().eq("id", nota_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Nota fiscal não encontrada")
    # notas_fiscais_maquinas é apagada em cascata pela FK ON DELETE CASCADE
