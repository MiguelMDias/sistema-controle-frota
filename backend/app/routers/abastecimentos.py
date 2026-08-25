from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.auth_deps import exigir_admin, obter_usuario_atual, UsuarioLogado
from app.auditoria import registrar_log
from app.database import get_supabase
from app.maquina_guard import validar_maquina_permite_lancamento
from app.schemas.abastecimentos import Abastecimento, AbastecimentoCreate, AbastecimentoUpdate

router = APIRouter(prefix="/abastecimentos", tags=["Abastecimentos"])

SELECT_COM_JOIN = "*, maquinas(codigo), fornecedores(nome)"


def _achatar(registro: dict) -> dict:
    maquina = registro.pop("maquinas", None) or {}
    fornecedor = registro.pop("fornecedores", None) or {}
    registro["maquina_codigo"] = maquina.get("codigo")
    registro["fornecedor_nome"] = fornecedor.get("nome")
    return registro


@router.get("", response_model=list[Abastecimento])
def listar_abastecimentos(
    maquina_id: Optional[int] = None,
    tipo_combustivel: Optional[str] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
):
    """Filtros equivalentes à tela: Máquina, Tipo de Combustível, Período de/até."""
    sb = get_supabase()
    query = sb.table("abastecimentos").select(SELECT_COM_JOIN)

    if maquina_id:
        query = query.eq("maquina_id", maquina_id)
    if tipo_combustivel:
        query = query.eq("tipo_combustivel", tipo_combustivel)
    if data_inicio:
        query = query.gte("data", data_inicio.isoformat())
    if data_fim:
        query = query.lte("data", data_fim.isoformat())

    resp = query.order("data", desc=True).execute()
    return [_achatar(r) for r in resp.data]


@router.post("", response_model=Abastecimento, status_code=201)
def criar_abastecimento(abastecimento: AbastecimentoCreate, usuario: UsuarioLogado = Depends(obter_usuario_atual)):
    sb = get_supabase()

    validar_maquina_permite_lancamento(abastecimento.maquina_id)

    resp = sb.table("abastecimentos").insert(abastecimento.model_dump(mode="json")).execute()
    criado = sb.table("abastecimentos").select(SELECT_COM_JOIN).eq("id", resp.data[0]["id"]).execute()
    achatado = _achatar(criado.data[0])
    registrar_log(usuario, "criar", "abastecimento", achatado["id"], f"Abastecimento registrado para {achatado['maquina_codigo']}", dados_depois=resp.data[0])
    return achatado
    # horimetro_atual/km_atual são atualizados automaticamente pelo trigger no banco


@router.patch("/{abastecimento_id}", response_model=Abastecimento)
def atualizar_abastecimento(abastecimento_id: int, abastecimento: AbastecimentoUpdate, usuario: UsuarioLogado = Depends(obter_usuario_atual)):
    sb = get_supabase()
    dados = abastecimento.model_dump(mode="json", exclude_unset=True)
    if not dados:
        raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualização")

    existente = sb.table("abastecimentos").select("*").eq("id", abastecimento_id).execute()
    if not existente.data:
        raise HTTPException(status_code=404, detail="Abastecimento não encontrado")
    antes = existente.data[0]
    validar_maquina_permite_lancamento(abastecimento.maquina_id or antes["maquina_id"])

    resp = sb.table("abastecimentos").update(dados).eq("id", abastecimento_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Abastecimento não encontrado")

    atualizado = sb.table("abastecimentos").select(SELECT_COM_JOIN).eq("id", abastecimento_id).execute()
    achatado = _achatar(atualizado.data[0])
    registrar_log(usuario, "atualizar", "abastecimento", abastecimento_id, f"Abastecimento de {achatado['maquina_codigo']} atualizado", dados_antes=antes, dados_depois=resp.data[0])
    return achatado


@router.delete("/{abastecimento_id}", status_code=204)
def excluir_abastecimento(abastecimento_id: int, usuario: UsuarioLogado = Depends(exigir_admin)):
    sb = get_supabase()
    existente = sb.table("abastecimentos").select(SELECT_COM_JOIN).eq("id", abastecimento_id).execute()
    resp = sb.table("abastecimentos").delete().eq("id", abastecimento_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Abastecimento não encontrado")
    maquina_codigo = _achatar(existente.data[0])["maquina_codigo"] if existente.data else "?"
    registrar_log(usuario, "excluir", "abastecimento", abastecimento_id, f"Abastecimento de {maquina_codigo} excluído", dados_antes=(existente.data[0] if existente.data else None))


@router.get("/consumo/{maquina_id}")
def calcular_consumo(maquina_id: int):
    """
    Calcula a eficiência média entre abastecimentos consecutivos da máquina:
    - carro: km rodados / litros consumidos = km/l
    - trator/empilhadeira a combustão: horas trabalhadas / litros (ou kg de gás) = h/litro (ou h/kg)
    - empilhadeira elétrica: horas trabalhadas / kWh = h/kWh

    A métrica retornada depende de qual leitura (horimetro ou km) a máquina usa,
    e do tipo de "combustível" (litros, kg ou kWh) de cada registro.
    """
    sb = get_supabase()

    maquina_resp = sb.table("maquinas").select("id, codigo, tipo").eq("id", maquina_id).execute()
    if not maquina_resp.data:
        raise HTTPException(status_code=404, detail="Máquina não encontrada")
    maquina = maquina_resp.data[0]

    registros = (
        sb.table("abastecimentos")
        .select("data, quantidade, tipo_combustivel, horimetro, km")
        .eq("maquina_id", maquina_id)
        .order("data")
        .execute()
        .data
    )

    if len(registros) < 2:
        return {
            "maquina_id": maquina_id,
            "maquina_codigo": maquina["codigo"],
            "consumo_medio": None,
            "unidade": None,
            "mensagem": "São necessários pelo menos 2 abastecimentos para calcular consumo médio.",
        }

    usa_km = maquina["tipo"] == "carro"
    campo_leitura = "km" if usa_km else "horimetro"

    diffs = []
    for anterior, atual in zip(registros, registros[1:]):
        leitura_anterior = anterior.get(campo_leitura)
        leitura_atual = atual.get(campo_leitura)
        quantidade = atual.get("quantidade")
        if leitura_anterior is None or leitura_atual is None or not quantidade:
            continue
        percorrido = leitura_atual - leitura_anterior
        if percorrido > 0:
            diffs.append(percorrido / quantidade)

    if not diffs:
        return {
            "maquina_id": maquina_id,
            "maquina_codigo": maquina["codigo"],
            "consumo_medio": None,
            "unidade": None,
            "mensagem": "Leituras de horímetro/km insuficientes nos abastecimentos para calcular.",
        }

    media = sum(diffs) / len(diffs)
    unidade_qtd = registros[-1]["tipo_combustivel"]
    unidade = f"{'km' if usa_km else 'h'}/{'litro' if unidade_qtd != 'energia_eletrica' else 'kWh'}"

    return {
        "maquina_id": maquina_id,
        "maquina_codigo": maquina["codigo"],
        "consumo_medio": round(media, 2),
        "unidade": unidade,
    }
