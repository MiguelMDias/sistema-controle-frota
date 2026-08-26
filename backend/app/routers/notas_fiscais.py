import re
import xml.etree.ElementTree as ET
from defusedxml.ElementTree import fromstring as fromstring_seguro
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.auth_deps import exigir_admin, exigir_operacional, obter_usuario_atual, UsuarioLogado
from app.auditoria import registrar_log
from app.database import get_supabase
from app.maquina_guard import validar_maquina_permite_lancamento
from app.schemas.notas_fiscais import NotaFiscal, NotaFiscalCreate, NotaFiscalUpdate

router = APIRouter(prefix="/notas-fiscais", tags=["Notas Fiscais"])

SELECT_COM_JOIN = (
    "*, fornecedores(nome), notas_fiscais_maquinas(maquinas(codigo)), notas_fiscais_itens(*)"
)

# Namespace padrão dos XMLs de NF-e emitidos pela SEFAZ
NFE_NS = {"nfe": "http://www.portalfiscal.inf.br/nfe"}


def _achatar(registro: dict) -> dict:
    fornecedor = registro.pop("fornecedores", None) or {}
    vinculos = registro.pop("notas_fiscais_maquinas", None) or []
    registro["fornecedor_nome"] = fornecedor.get("nome")
    registro["maquinas"] = [
        v["maquinas"]["codigo"] for v in vinculos if v.get("maquinas")
    ]
    registro["itens"] = registro.pop("notas_fiscais_itens", None) or []
    return registro


def _substituir_itens(sb, nota_id: int, itens: list) -> None:
    sb.table("notas_fiscais_itens").delete().eq("nota_fiscal_id", nota_id).execute()
    if itens:
        linhas = [
            {
                "nota_fiscal_id": nota_id,
                "nome": item.nome,
                "quantidade": item.quantidade,
                "valor_unitario": item.valor_unitario,
            }
            for item in itens
        ]
        sb.table("notas_fiscais_itens").insert(linhas).execute()


@router.get("", response_model=list[NotaFiscal])
def listar_notas_fiscais(
    tipo: Optional[str] = None,
    maquina_id: Optional[int] = None,
    centro_despesa_id: Optional[int] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    busca: Optional[str] = None,
):
    """Filtros equivalentes à tela: Pesquisar, Tipo, Máquina, Centro de Despesa, Período de/até."""
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
    if centro_despesa_id:
        query = query.eq("centro_despesa_id", centro_despesa_id)
    if data_inicio:
        query = query.gte("data_emissao", data_inicio.isoformat())
    if data_fim:
        query = query.lte("data_emissao", data_fim.isoformat())
    if busca:
        query = query.ilike("numero", f"%{busca}%")

    resp = query.order("data_emissao", desc=True).execute()
    return [_achatar(r) for r in resp.data]


def _validar_referencias(sb, nota) -> None:
    """Confirma que fornecedor/centro de despesa informados realmente existem,
    dando uma mensagem específica em vez de deixar o banco recusar sem contexto."""
    fornecedor_id = getattr(nota, "fornecedor_id", None)
    if fornecedor_id is not None:
        existe = sb.table("fornecedores").select("id").eq("id", fornecedor_id).execute()
        if not existe.data:
            raise HTTPException(status_code=422, detail="Fornecedor selecionado não existe. Escolha outro ou cadastre um novo.")

    centro_despesa_id = getattr(nota, "centro_despesa_id", None)
    if centro_despesa_id is not None:
        existe = sb.table("centros_despesa").select("id").eq("id", centro_despesa_id).execute()
        if not existe.data:
            raise HTTPException(status_code=422, detail="Centro de despesa selecionado não existe.")


@router.post("", response_model=NotaFiscal, status_code=201)
def criar_nota_fiscal(nota: NotaFiscalCreate, usuario: UsuarioLogado = Depends(exigir_operacional)):
    sb = get_supabase()

    _validar_referencias(sb, nota)

    for maquina_id in (nota.maquina_ids or []):
        validar_maquina_permite_lancamento(maquina_id)

    dados = nota.model_dump(mode="json", exclude={"maquina_ids", "itens"})
    resp = sb.table("notas_fiscais").insert(dados).execute()
    nota_id = resp.data[0]["id"]

    if nota.maquina_ids:
        vinculos = [{"nota_fiscal_id": nota_id, "maquina_id": mid} for mid in nota.maquina_ids]
        sb.table("notas_fiscais_maquinas").insert(vinculos).execute()

    if nota.itens:
        _substituir_itens(sb, nota_id, nota.itens)

    criada = sb.table("notas_fiscais").select(SELECT_COM_JOIN).eq("id", nota_id).execute()
    achatada = _achatar(criada.data[0])
    registrar_log(usuario, "criar", "nota_fiscal", nota_id, f"Nota fiscal {achatada['numero']}/{achatada['serie']} cadastrada", dados_depois=resp.data[0])
    return achatada


@router.patch("/{nota_id}", response_model=NotaFiscal)
def atualizar_nota_fiscal(nota_id: int, nota: NotaFiscalUpdate, usuario: UsuarioLogado = Depends(exigir_operacional)):
    sb = get_supabase()

    existente = sb.table("notas_fiscais").select("*").eq("id", nota_id).execute()
    if not existente.data:
        raise HTTPException(status_code=404, detail="Nota fiscal não encontrada")
    antes = existente.data[0]

    _validar_referencias(sb, nota)

    dados = nota.model_dump(mode="json", exclude_unset=True, exclude={"maquina_ids", "itens"})

    if nota.maquina_ids is not None:
        for maquina_id in nota.maquina_ids:
            validar_maquina_permite_lancamento(maquina_id)

    dados_depois_tabela = antes
    if dados:
        resp = sb.table("notas_fiscais").update(dados).eq("id", nota_id).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Nota fiscal não encontrada")
        dados_depois_tabela = resp.data[0]

    if nota.maquina_ids is not None:
        # substitui os vínculos: apaga os antigos e recria com a lista nova
        sb.table("notas_fiscais_maquinas").delete().eq("nota_fiscal_id", nota_id).execute()
        if nota.maquina_ids:
            vinculos = [{"nota_fiscal_id": nota_id, "maquina_id": mid} for mid in nota.maquina_ids]
            sb.table("notas_fiscais_maquinas").insert(vinculos).execute()

    if nota.itens is not None:
        _substituir_itens(sb, nota_id, nota.itens)

    atualizada = sb.table("notas_fiscais").select(SELECT_COM_JOIN).eq("id", nota_id).execute()
    if not atualizada.data:
        raise HTTPException(status_code=404, detail="Nota fiscal não encontrada")
    numero_serie = f"{antes['numero']}/{antes['serie']}"
    registrar_log(usuario, "atualizar", "nota_fiscal", nota_id, f"Nota fiscal {numero_serie} atualizada", dados_antes=antes, dados_depois=dados_depois_tabela)
    return _achatar(atualizada.data[0])


@router.delete("/{nota_id}", status_code=204)
def excluir_nota_fiscal(nota_id: int, usuario: UsuarioLogado = Depends(exigir_admin)):
    sb = get_supabase()
    existente = sb.table("notas_fiscais").select("*").eq("id", nota_id).execute()
    resp = sb.table("notas_fiscais").delete().eq("id", nota_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Nota fiscal não encontrada")
    # notas_fiscais_maquinas e notas_fiscais_itens são apagadas em cascata pela FK ON DELETE CASCADE
    numero_serie = f"{existente.data[0]['numero']}/{existente.data[0]['serie']}" if existente.data else f"id={nota_id}"
    registrar_log(usuario, "excluir", "nota_fiscal", nota_id, f"Nota fiscal {numero_serie} excluída", dados_antes=(existente.data[0] if existente.data else None))


# ==================== Importação de XML (NF-e) ====================

def _texto(elemento: Optional[ET.Element]) -> Optional[str]:
    return elemento.text.strip() if elemento is not None and elemento.text else None


def _extrair_nfe(xml_bytes: bytes) -> dict:
    """
    Extrai os campos relevantes de um XML de NF-e padrão SEFAZ.
    Lança HTTPException(422) com mensagem específica se o XML não for reconhecido.
    """
    try:
        root = fromstring_seguro(xml_bytes)
    except ET.ParseError as exc:
        raise HTTPException(status_code=422, detail=f"Arquivo XML inválido ou corrompido: {exc}")
    except Exception as exc:
        # defusedxml lança sua própria exceção quando detecta um XML malicioso
        # (entidades expandindo demais, referências externas, etc)
        raise HTTPException(status_code=422, detail="Arquivo XML rejeitado por motivo de segurança.")

    inf_nfe = root.find(".//nfe:infNFe", NFE_NS)
    if inf_nfe is None:
        raise HTTPException(
            status_code=422,
            detail="XML não parece ser uma NF-e válida (tag <infNFe> não encontrada).",
        )

    ide = inf_nfe.find("nfe:ide", NFE_NS)
    emit = inf_nfe.find("nfe:emit", NFE_NS)
    total = inf_nfe.find(".//nfe:ICMSTot", NFE_NS)

    if ide is None or emit is None or total is None:
        raise HTTPException(
            status_code=422,
            detail="XML de NF-e incompleto: faltam informações obrigatórias (identificação, emitente ou totais).",
        )

    numero = _texto(ide.find("nfe:nNF", NFE_NS))
    serie = _texto(ide.find("nfe:serie", NFE_NS)) or "1"
    data_emissao_raw = _texto(ide.find("nfe:dhEmi", NFE_NS)) or _texto(ide.find("nfe:dEmi", NFE_NS))

    if not numero or not data_emissao_raw:
        raise HTTPException(
            status_code=422,
            detail="XML de NF-e sem número da nota ou data de emissão -- não é possível importar.",
        )

    data_emissao = data_emissao_raw[:10]  # "2026-08-20T10:00:00-03:00" -> "2026-08-20"

    cnpj_emit = _texto(emit.find("nfe:CNPJ", NFE_NS))
    nome_emit = _texto(emit.find("nfe:xNome", NFE_NS))
    if not cnpj_emit:
        raise HTTPException(status_code=422, detail="XML de NF-e sem CNPJ do emitente -- não é possível vincular o fornecedor.")
    cnpj_emit = re.sub(r"\D", "", cnpj_emit)

    valor_total_raw = _texto(total.find("nfe:vNF", NFE_NS))
    valor_total = float(valor_total_raw) if valor_total_raw else 0.0

    itens = []
    for det in inf_nfe.findall("nfe:det", NFE_NS):
        prod = det.find("nfe:prod", NFE_NS)
        if prod is None:
            continue
        nome_item = _texto(prod.find("nfe:xProd", NFE_NS)) or "Item sem descrição"
        qtd_raw = _texto(prod.find("nfe:qCom", NFE_NS))
        valor_unit_raw = _texto(prod.find("nfe:vUnCom", NFE_NS))
        itens.append({
            "nome": nome_item[:200],
            "quantidade": float(qtd_raw) if qtd_raw else 1.0,
            "valor_unitario": float(valor_unit_raw) if valor_unit_raw else 0.0,
        })

    return {
        "numero": numero[-10:],  # numero da NF-e pode ter mais de 10 dígitos em raras exceções; trunca com segurança
        "serie": serie,
        "data_emissao": data_emissao,
        "valor_total": valor_total,
        "fornecedor_cnpj": cnpj_emit,
        "fornecedor_nome": nome_emit,
        "itens": itens,
    }


@router.post("/importar-xml")
def importar_xml_nfe(arquivo: UploadFile = File(...), usuario: UsuarioLogado = Depends(exigir_operacional)):
    """
    Lê um XML de NF-e e devolve os campos já preenchidos (número, série, data,
    valor total, itens e fornecedor) para revisão antes de salvar. Se o
    fornecedor (por CNPJ) ainda não existir no cadastro, ele é criado
    automaticamente com os dados básicos do emitente.
    """
    if not arquivo.filename.lower().endswith(".xml"):
        raise HTTPException(status_code=422, detail="Envie um arquivo .xml de NF-e.")

    TAMANHO_MAXIMO = 2 * 1024 * 1024  # 2MB -- uma NF-e real tem no máximo algumas centenas de KB
    conteudo = arquivo.file.read(TAMANHO_MAXIMO + 1)
    if len(conteudo) > TAMANHO_MAXIMO:
        raise HTTPException(status_code=413, detail="Arquivo XML muito grande (máximo 2MB).")

    dados = _extrair_nfe(conteudo)

    sb = get_supabase()
    cnpj = dados.pop("fornecedor_cnpj")
    nome_emit = dados.pop("fornecedor_nome")

    fornecedor_resp = sb.table("fornecedores").select("id, nome").eq("cnpj", cnpj).execute()
    if fornecedor_resp.data:
        fornecedor = fornecedor_resp.data[0]
    else:
        novo = sb.table("fornecedores").insert({
            "nome": nome_emit or f"Fornecedor {cnpj}",
            "cnpj": cnpj,
        }).execute()
        fornecedor = novo.data[0]
        registrar_log(usuario, "criar", "fornecedor", fornecedor["id"], f"Fornecedor {fornecedor['nome']} criado automaticamente via importação de XML de NF-e")

    dados["fornecedor_id"] = fornecedor["id"]
    dados["fornecedor_nome"] = fornecedor["nome"]
    return dados
